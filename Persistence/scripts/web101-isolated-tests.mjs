
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";

const [importerPath] = process.argv.slice(2);

if (!importerPath || !fs.existsSync(importerPath)) {
  throw new Error("Verified importer path is required.");
}

const hash = (data) =>
  crypto.createHash("sha256").update(data).digest("hex").toUpperCase();

const source = fs.readFileSync(importerPath, "utf8");

function extractFunction(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);

  assert.ok(start >= 0 && end > start, "Function boundaries missing");
  assert.equal(source.indexOf(startMarker, start + 1), -1);

  return source.slice(start, end);
}

const copySource = extractFunction(
  "async function copyWEB101Document(plan) {",
  "async function insertWEB101Transaction(pool, plan) {"
);

const txSource = extractFunction(
  "async function insertWEB101Transaction(pool, plan) {",
  "async function coordinateWEB101Migration(plan) {"
);

assert.equal(
  hash(copySource),
  "BE5F49720A5239198571B4700295E5331AB90FE5B306F48B8273C3857E458B4D"
);

assert.equal(
  hash(txSource),
  "B114868AC85A7F5734E029A8A479AAB790E02BDD7D8FF8089FD9C1A65C6E7B38"
);

console.log("PASS: Actual function fingerprints");

let passed = 0;

async function test(name, fn) {
  await fn();
  passed++;
  console.log(`PASS: ${name}`);
}

const tmp = fs.mkdtempSync(
  path.join(os.tmpdir(), "web101-consolidated-")
);

let success = false;

try {
  // ============================================
  // FILESYSTEM TESTS
  // ============================================

  const pdfBytes = Buffer.from(
    "ISOLATED_WEB101_PDF_TEST_CONTENT"
  );

  const expectedPdfHash = hash(pdfBytes);

  const importPattern =
    /await import\(\s*"\.\.\/src\/services\/Storage\/certificationDocumentStorageService\.js"\s*\)/g;

  assert.equal(
    [...copySource.matchAll(importPattern)].length,
    1
  );

  const isolatedCopy = copySource.replace(
    importPattern,
    "await Promise.resolve(testStorage)"
  );

  function makeCopy(name, options = {}) {
    const base = path.join(tmp, name);
    const storageRoot = path.join(base, "storage");
    const userDir = path.join(storageRoot, "user");
    const certDir = path.join(userDir, "cert");
    const destination = path.join(certDir, "document.pdf");
    const pdfPath = path.join(base, "source.pdf");

    fs.mkdirSync(storageRoot, { recursive: true });

    fs.writeFileSync(
      pdfPath,
      options.badSource ? Buffer.from("BAD") : pdfBytes
    );

    if (options.unsafe) {
      fs.writeFileSync(userDir, "not a directory");
    }

    if (options.existing) {
      fs.mkdirSync(certDir, { recursive: true });
      fs.writeFileSync(destination, "DO_NOT_OVERWRITE");
    }

    const testStorage = {
      getCertificationDocumentStorageRoot: () => storageRoot,

      assertSafeCertificationDocumentDirectory: async () => {
        for (const dir of [storageRoot, userDir, certDir]) {
          const stat = fs.lstatSync(dir);

          assert.ok(
            stat.isDirectory() && !stat.isSymbolicLink()
          );
        }
      }
    };

    const testFs = options.interrupted
      ? new Proxy(fs, {
          get(target, key) {
            if (key === "writeFileSync") {
              return (fd, data, ...args) => {
                if (typeof fd === "number") {
                  target.writeFileSync(fd, data.subarray(0, 4));
                  throw new Error("SIMULATED_INTERRUPTED_WRITE");
                }

                return target.writeFileSync(fd, data, ...args);
              };
            }

            return Reflect.get(target, key);
          }
        })
      : fs;

    const context = {
      assert,
      fs: testFs,
      path,
      testStorage,
      pdfPath,
      expectedPdfHash,
      userId: "test-user",
      sha256: hash,
      Promise
    };

    const copy = vm.runInNewContext(
      `(${isolatedCopy})`,
      context
    );

    const plan = {
      certification: { id: "isolated-cert" },
      document: { size: pdfBytes.length },
      destination
    };

    return { copy, plan, destination };
  }

  await test("PDF copy and checksum", async () => {
    const s = makeCopy("copy");
    const result = await s.copy(s.plan);

    assert.equal(result.copied, true);

    assert.equal(
      hash(fs.readFileSync(s.destination)),
      expectedPdfHash
    );
  });

  await test("Existing PDF preserved", async () => {
    const s = makeCopy("existing", { existing: true });

    await assert.rejects(
      () => s.copy(s.plan),
      { code: "EEXIST" }
    );

    assert.equal(
      fs.readFileSync(s.destination, "utf8"),
      "DO_NOT_OVERWRITE"
    );
  });

  await test("Unsafe directory rejected", async () => {
    const s = makeCopy("unsafe", { unsafe: true });

    await assert.rejects(
      () => s.copy(s.plan),
      /Unsafe Certification storage directory/
    );
  });

  await test("Bad source checksum rejected", async () => {
    const s = makeCopy("checksum", { badSource: true });

    await assert.rejects(
      () => s.copy(s.plan),
      /WEB101 source PDF checksum mismatch/
    );

    assert.equal(fs.existsSync(s.destination), false);
  });

  await test("Interrupted copy preserved", async () => {
    const s = makeCopy("interrupted", {
      interrupted: true
    });

    await assert.rejects(
      () => s.copy(s.plan),
      /SIMULATED_INTERRUPTED_WRITE/
    );

    assert.equal(
      fs.readFileSync(s.destination).length,
      4
    );
  });

  // ============================================
  // SQL TRANSACTION TESTS
  // ============================================

  const skillId =
    "skill-54e7185b-3cb7-42bb-88ca-ab87ae3b756b";

  const plan = {
    certification: {
      id: "test-cert",
      name: "WEB101",
      certificationType: "Course",
      issuingOrganization: {
        name: "CodePath"
      },
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      skillRelationships: [{ skillId }]
    },

    document: {
      id: "test-doc",
      fileName: "certificate.pdf",
      mimeType: "application/pdf",
      size: 100,
      uploadedAt: "2026-01-01T00:00:00Z"
    },

    storageKey: "test-storage-key"
  };

  function mockTx(options = {}) {
    const events = [];
    const errors = [];

    class Transaction {
      async begin(level) {
        events.push("begin");
        assert.equal(level, "SERIALIZABLE");

        if (options.failBegin) {
          throw new Error("BEGIN_FAILED");
        }
      }

      async commit() {
        events.push("commit");

        if (options.failCommit) {
          throw new Error("COMMIT_FAILED");
        }
      }

      async rollback() {
        events.push("rollback");

        if (options.failRollback) {
          throw new Error("ROLLBACK_FAILED");
        }
      }
    }

    class Request {
      input() {
        return this;
      }

      async query(query) {
        const q = query.trim();
        let stage;

        if (q.includes("DB_NAME()")) {
          stage = "identity";
        } else if (q.includes("AS owner_count")) {
          stage = "conflicts";
        } else if (q.includes("AS skill_count")) {
          stage = "skill";
        } else if (
          q.includes("INSERT INTO dbo.certifications")
        ) {
          stage = "certInsert";
        } else if (
          q.includes("INSERT INTO dbo.certification_documents")
        ) {
          stage = "docInsert";
        } else if (
          q.includes("AS certification_count") &&
          q.includes("AS document_count")
        ) {
          stage = "verify";
        } else {
          throw new Error("UNKNOWN_SQL_QUERY");
        }

        events.push(stage);

        if (options.failStage === stage) {
          throw new Error("INJECTED_" + stage);
        }

        switch (stage) {
          case "identity":
            return {
              recordset: [{
                database_name: options.wrongDb
                  ? "wrong-db"
                  : "portfolio-platform-db"
              }]
            };

          case "conflicts":
            return {
              recordset: [{
                owner_count: 1,
                certification_count: options.duplicate ? 1 : 0,
                document_count: 0,
                storage_key_count: 0
              }]
            };

          case "skill":
            return {
              recordset: [{
                skill_count: options.noSkill ? 0 : 1
              }]
            };

          case "certInsert":
          case "docInsert":
            return { rowsAffected: [1] };

          case "verify":
            return {
              recordset: [{
                certification_count: 1,
                document_count: options.badVerify ? 0 : 1
              }]
            };
        }
      }
    }

    const sql = {
      Transaction,
      Request,
      ISOLATION_LEVEL: {
        SERIALIZABLE: "SERIALIZABLE"
      },
      UniqueIdentifier: "uuid",
      NVarChar: () => "nvarchar",
      DateTime2: () => "datetime",
      BigInt: "bigint",
      MAX: "max"
    };

    const context = {
      sql,
      assert,
      userId: "test-user",
      Date,
      JSON,
      console: {
        error: (...args) => {
          errors.push(args.join(" "));
        }
      }
    };

    const insert = vm.runInNewContext(
      `(${txSource})`,
      context
    );

    return { insert, events, errors };
  }

  await test("SQL successful commit", async () => {
    const s = mockTx();
    const result = await s.insert({}, plan);

    assert.equal(result.committed, true);
    assert.equal(
      s.events.filter(x => x === "commit").length,
      1
    );
    assert.ok(!s.events.includes("rollback"));

    assert.equal(
      s.events.filter(
        x => x === "certInsert" || x === "docInsert"
      ).length,
      2
    );
  });

  await test("SQL certification INSERT rollback", async () => {
    const s = mockTx({ failStage: "certInsert" });

    await assert.rejects(
      () => s.insert({}, plan),
      /INJECTED_certInsert/
    );

    assert.ok(s.events.includes("rollback"));
    assert.ok(!s.events.includes("commit"));
  });

  await test("SQL document INSERT rollback", async () => {
    const s = mockTx({ failStage: "docInsert" });

    await assert.rejects(
      () => s.insert({}, plan),
      /INJECTED_docInsert/
    );

    assert.ok(s.events.includes("rollback"));
    assert.ok(!s.events.includes("commit"));
  });

  await test("SQL verification failure rollback", async () => {
    const s = mockTx({ badVerify: true });

    await assert.rejects(
      () => s.insert({}, plan)
    );

    assert.ok(s.events.includes("rollback"));
    assert.ok(!s.events.includes("commit"));
  });

  await test("SQL rollback failure reported", async () => {
    const s = mockTx({
      failStage: "docInsert",
      failRollback: true
    });

    await assert.rejects(
      () => s.insert({}, plan),
      /INJECTED_docInsert/
    );

    assert.ok(s.events.includes("rollback"));

    assert.ok(
      s.errors.some(x =>
        x.includes("rollback could not be confirmed")
      )
    );
  });

  await test("SQL uncertain commit warning", async () => {
    const s = mockTx({ failCommit: true });

    await assert.rejects(
      () => s.insert({}, plan),
      /COMMIT_FAILED/
    );

    assert.ok(s.events.includes("commit"));
    assert.ok(!s.events.includes("rollback"));

    assert.ok(
      s.errors.some(x =>
        x.includes("Commit outcome may be uncertain")
      )
    );
  });

  await test("SQL duplicate rejected", async () => {
    const s = mockTx({ duplicate: true });

    await assert.rejects(
      () => s.insert({}, plan)
    );

    assert.ok(s.events.includes("rollback"));
    assert.ok(!s.events.includes("certInsert"));
  });

  await test("SQL wrong database rejected", async () => {
    const s = mockTx({ wrongDb: true });

    await assert.rejects(
      () => s.insert({}, plan)
    );

    assert.ok(s.events.includes("rollback"));
    assert.ok(!s.events.includes("certInsert"));
  });

  await test("SQL unowned Skill rejected", async () => {
    const s = mockTx({ noSkill: true });

    await assert.rejects(
      () => s.insert({}, plan)
    );

    assert.ok(s.events.includes("rollback"));
    assert.ok(!s.events.includes("certInsert"));
  });

  await test("SQL BEGIN failure", async () => {
    const s = mockTx({ failBegin: true });

    await assert.rejects(
      () => s.insert({}, plan),
      /BEGIN_FAILED/
    );

    assert.ok(!s.events.includes("rollback"));
  });

  console.log(
    `ALL ${passed} ISOLATED FUNCTION TESTS PASSED`
  );

  success = true;
} finally {
  if (success) {
    fs.rmSync(tmp, {
      recursive: true,
      force: true
    });
  } else {
    console.error(
      "Temporary test files retained:",
      tmp
    );
  }
}
