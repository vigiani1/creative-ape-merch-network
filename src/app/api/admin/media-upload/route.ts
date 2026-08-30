import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

function safeName(value:string){
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"");
}

export async function POST(request:Request){
  const { supabase,userId }=await requireUser();
  const formData=await request.formData();
  const file=formData.get("file");
  const scope=String(formData.get("scope") ?? "organization");
  const organizationId=String(formData.get("organizationId") ?? "");
  const requestedType=String(formData.get("mediaType") ?? "");

  if(!(file instanceof File)) return NextResponse.json({error:"Choose a file to upload."},{status:400});

  const isImage=file.type.startsWith("image/");
  const isVideo=file.type==="video/mp4" || file.type==="video/webm";
  const mediaType=isVideo ? "video" : isImage ? "image" : "";

  if(!mediaType) return NextResponse.json({error:"Supported uploads are images, MP4 video, and WebM video."},{status:400});
  if(requestedType && requestedType!==mediaType) return NextResponse.json({error:`Choose a ${requestedType} file for this upload button.`},{status:400});

  const maxBytes=50*1024*1024;
  if(file.size>maxBytes) return NextResponse.json({error:"File must be 50 MB or smaller."},{status:400});

  const [{data:profile},{data:memberships}]=await Promise.all([
    supabase.from("profiles").select("platform_role").eq("id",userId).maybeSingle(),
    supabase.from("organization_members").select("organization_id,role").eq("user_id",userId),
  ]);

  const isSuperAdmin=profile?.platform_role==="super_admin";
  const memberOrgIds=new Set((memberships ?? []).map((membership)=>membership.organization_id));

  if(scope==="master" && !isSuperAdmin){
    return NextResponse.json({error:"Master Library uploads require platform administrator access."},{status:403});
  }
  if(scope!=="master" && (!organizationId || (!isSuperAdmin && !memberOrgIds.has(organizationId)))){
    return NextResponse.json({error:"You do not have access to that organization library."},{status:403});
  }

  const folder=scope==="master" ? "master" : organizationId;
  const storagePath=`${folder}/${mediaType}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const bytes=new Uint8Array(await file.arrayBuffer());

  const {error:uploadError}=await supabase.storage.from("media-library").upload(storagePath,bytes,{
    contentType:file.type,cacheControl:"3600",upsert:false
  });
  if(uploadError) return NextResponse.json({error:uploadError.message},{status:400});

  const {data:asset,error:assetError}=await supabase.from("media_assets").insert({
    organization_id:scope==="master"?null:organizationId,
    scope:scope==="master"?"master":"organization",
    media_type:mediaType,
    title:file.name.replace(/\.[^.]+$/,""),
    file_name:file.name,
    mime_type:file.type,
    bucket_name:"media-library",
    storage_path:storagePath,
    alt_text:mediaType==="image" ? file.name.replace(/\.[^.]+$/,"") : null,
    tags:[],
    is_public:true,
  }).select("id,storage_path,media_type").single();

  if(assetError || !asset){
    await supabase.storage.from("media-library").remove([storagePath]);
    return NextResponse.json({error:assetError?.message || "Unable to save media."},{status:400});
  }

  const publicUrl=supabase.storage.from("media-library").getPublicUrl(storagePath).data.publicUrl;
  return NextResponse.json({assetId:asset.id,url:publicUrl,mediaType:asset.media_type});
}
