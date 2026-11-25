export const sections = {overview:"Overview", timeline:"Timeline", contributions:"Role and contributions", problem:"Problem and objectives", solution:"Solution", architecture:"Architecture", features:"Features", technologies:"Technologies and skills", results:"Results and metrics", awards:"Awards", media:"Media", documents:"Documents"};
export const links = {repository:"GitHub repository", liveWebsite:"Live website", caseStudy:"External case study"};
export function normalizeDisplay(value) {
  const flags = (keys, source) => Object.fromEntries(Object.keys(keys).map(key => [key, source?.[key] !== false]));
  const selection = source => ({selectionMode: ["all","selected","none"].includes(source?.selectionMode) ? source.selectionMode : "all", selectedIds: Array.isArray(source?.selectedIds) ? [...new Set(source.selectedIds.filter(id => typeof id === "string"))] : []});
  return {schemaVersion:1, sections:flags(sections,value?.sections), links:flags(links,value?.links), media:selection(value?.media), documents:{...selection(value?.documents),allowDownload:value?.documents?.allowDownload !== false}};
}
export function applyProjectDisplay(project, value) {
  const s = normalizeDisplay(value), f = s.sections;
  const select = (assets, config, visible) => visible ? (assets || []).filter(a => config.selectionMode === "all" || (config.selectionMode === "selected" && config.selectedIds.includes(a.id))) : [];
  const media = select(project.media,s.media,f.media);
  const documents = select(project.supportingDocuments,s.documents,f.documents);
  const featured = media.find(a => a.isFeatured) || media[0];
  return {...project, dates:f.timeline?project.dates:null, role:f.contributions?project.role:"", organization:f.contributions?project.organization:null, ownership:f.contributions?project.ownership:null,
    presentation:{...project.presentation,shortSummary:f.overview?project.presentation?.shortSummary:"",caseStudy:f.overview?project.presentation?.caseStudy:"",featuredMediaId:featured?.id || ""},
    problem:f.problem?project.problem:null, solution:project.solution?{...project.solution,overview:f.overview?project.solution.overview:"",approach:f.solution?project.solution.approach:"",architecture:f.architecture?project.solution.architecture:"",features:f.features?project.solution.features:[],contributions:f.contributions?project.solution.contributions:[]}:null,
    technologies:f.technologies?project.technologies:[],skillRelationships:f.technologies?project.skillRelationships:[],results:f.results?project.results:null,awards:f.awards?project.awards:[],media:media.map(a=>({...a,isFeatured:a.id===featured?.id})),supportingDocuments:documents,
    links:project.links?{repositoryUrl:s.links.repository?project.links.repositoryUrl:"",liveUrl:s.links.liveWebsite?project.links.liveUrl:"",caseStudyUrl:s.links.caseStudy?project.links.caseStudyUrl:""}:null, displaySettings:s};
}
