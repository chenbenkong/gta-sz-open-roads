globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var r="morphTargetsVertexGlobalDeclaration",t=`#ifdef MORPHTARGETS
uniform morphTargetInfluences : array<f32,NUM_MORPH_INFLUENCERS>;
#ifdef MORPHTARGETS_TEXTURE 
uniform morphTargetTextureIndices : array<f32,NUM_MORPH_INFLUENCERS>;uniform morphTargetTextureInfo : vec3<f32>;var morphTargets : texture_2d_array<f32>;fn readVector3FromRawSampler(targetIndex : i32,vertexIndex : f32)->vec3<f32>
{ 
let textureWidth: i32=i32(uniforms.morphTargetTextureInfo.y);let y: i32=i32(vertexIndex)/textureWidth;let x: i32=i32(vertexIndex) % textureWidth;return textureLoad(morphTargets,vec2i(x,y),i32(uniforms.morphTargetTextureIndices[targetIndex]),0).xyz;}
fn readVector4FromRawSampler(targetIndex : i32,vertexIndex : f32)->vec4<f32>
{ 
let textureWidth: i32=i32(uniforms.morphTargetTextureInfo.y); 
let y: i32=i32(vertexIndex)/textureWidth;let x: i32=i32(vertexIndex) % textureWidth;return textureLoad(morphTargets,vec2i(x,y),i32(uniforms.morphTargetTextureIndices[targetIndex]),0);}
#endif
#endif
`;e.IncludesShadersStoreWGSL[r]||(e.IncludesShadersStoreWGSL[r]=t);var i={name:r,shader:t};export{i as a};
