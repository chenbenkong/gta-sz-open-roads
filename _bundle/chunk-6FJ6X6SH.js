globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var t="meshUVSpaceRendererFinaliserVertexShader",r=`attribute position: vec3f;attribute uv: vec2f;uniform worldViewProjection: mat4x4f;varying vUV: vec2f;@vertex
fn main(input : VertexInputs)->FragmentInputs {vertexOutputs.position=uniforms.worldViewProjection* vec4f(vertexInputs.position,1.0);vertexOutputs.positionvUV=vertexInputs.uv;}
`;e.ShadersStoreWGSL[t]||(e.ShadersStoreWGSL[t]=r);var n={name:t,shader:r};export{n as a};
