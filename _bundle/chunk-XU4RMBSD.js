globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as t}from"./chunk-HTIJ5P5S.js";var e="lightProxyPixelShader",i=`flat varying vOffset: u32;flat varying vMask: u32;uniform tileMaskResolution: vec3f;var<storage,read_write> tileMaskBuffer: array<atomic<u32>>;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let maskResolution=vec2u(uniforms.tileMaskResolution.yz);let tilePosition=vec2u(fragmentInputs.position.xy);let tileIndex=(tilePosition.x*maskResolution.x+tilePosition.y)*maskResolution.y+fragmentInputs.vOffset;atomicOr(&tileMaskBuffer[tileIndex],fragmentInputs.vMask);}
`;t.ShadersStoreWGSL[e]||(t.ShadersStoreWGSL[e]=i);var o={name:e,shader:i};export{o as a};
