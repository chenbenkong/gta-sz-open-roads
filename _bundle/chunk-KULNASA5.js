globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var r="rgbdDecodePixelShader",t=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(fromRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV)),1.0);}`;e.ShadersStoreWGSL[r]||(e.ShadersStoreWGSL[r]=t);var m={name:r,shader:t};export{m as a};
