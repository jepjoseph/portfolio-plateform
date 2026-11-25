import PortfolioVideoPlayer from "../PortfolioView/PortfolioVideoPlayer.jsx";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../../services/apiClient.js";
const labels = {description:"Overview", role:"Role", ownership:"Ownership", organization:"Organization", location:"Location", dates:"Timeline", problem:"Problem", solution:"Solution", results:"Results", technologies:"Technologies", skillRelationships:"Skills", awards:"Awards", presentation:"Summary"};
function Values({ value }) {
  if (typeof value === "string") return <p>{value}</p>;
  if (Array.isArray(value)) return value.map((item,index) => <Values key={index} value={item} />);
  if (value && typeof value === "object") return Object.entries(value).map(([key,item]) => <div key={key}><strong>{key.replace(/([A-Z])/g," $1")}</strong><Values value={item} /></div>);
  return null;
}
export default function PublicProjectDetails({project,routeKey}) {
  const url = (kind,asset,download=false) => `${API_BASE_URL}/public/portfolio-assets/${project.projectKey}/${kind}/${asset.assetId}?${new URLSearchParams({routeKey,...(download?{download:"1"}:{})})}`;
  const valid = asset => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(asset?.assetId || "");
  return <article className="pm-snapshot"><Link to={`/${routeKey}`}>Back to Portfolio</Link><h1>{project.title}</h1><p>{project.category}</p>
    {Object.entries(labels).filter(([key]) => project[key]).map(([key,label]) => <section className="pm-snapshot-section" key={key}><h2>{label}</h2><Values value={project[key]} /></section>)}
    {Array.isArray(project.publicMedia) && project.publicMedia.some(valid) && <section className="pm-snapshot-section"><h2>Project media</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%, 280px),1fr))",gap:"1rem"}}>
      {project.publicMedia.filter(valid).map((asset,index) => <figure key={asset.assetId} style={{margin:0,minWidth:0}}>
        {asset.type === "video" && <PortfolioVideoPlayer src={url("media",asset)} controls playsInline preload="metadata" style={{width:"100%",maxHeight:480}} />}
        {asset.type === "image" && <a href={url("media",asset)} target="_blank" rel="noopener noreferrer"><img src={url("media",asset)} alt={`Project image ${index+1}`} loading="lazy" style={{width:"100%",maxHeight:480,objectFit:"contain"}} /></a>}
        <figcaption><a href={url("media",asset)} target="_blank" rel="noopener noreferrer">Open media {index+1}</a></figcaption>
      </figure>)}
    </div></section>}
    {(Array.isArray(project.publicDocuments) ? project.publicDocuments : []).filter(valid).map((asset,index) => <p key={asset.assetId}><a href={url("documents",asset)} target="_blank" rel="noopener noreferrer">Preview document {index+1}</a>{asset.allowDownload === true && <> | <a href={url("documents",asset,true)}>Download</a></>}</p>)}
  </article>;
}
