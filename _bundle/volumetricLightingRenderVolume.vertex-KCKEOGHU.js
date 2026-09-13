globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import"./chunk-DULMO5H4.js";import"./chunk-TINRQ2PS.js";import{a as e}from"./chunk-HTIJ5P5S.js";import"./chunk-RZKNP5ZY.js";var t="volumetricLightingRenderVolumeVertexShader",o=`#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute position : vec3f;varying vWorldPos: vec4f;@vertex
fn main(input : VertexInputs)->FragmentInputs {let worldPos=mesh.world*vec4f(vertexInputs.position,1.0);vertexOutputs.vWorldPos=worldPos;vertexOutputs.position=scene.viewProjection*worldPos;}
`;e.ShadersStoreWGSL[t]||(e.ShadersStoreWGSL[t]=o);var s={name:t,shader:o};export{s as volumetricLightingRenderVolumeVertexShaderWGSL};
