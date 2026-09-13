globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var r="fresnelFunction",o=`#ifdef FRESNEL
fn computeFresnelTerm(viewDirection: vec3f,worldNormal: vec3f,bias: f32,power: f32)->f32
{let fresnelTerm: f32=pow(bias+abs(dot(viewDirection,worldNormal)),power);return clamp(fresnelTerm,0.,1.);}
#endif
`;e.IncludesShadersStoreWGSL[r]||(e.IncludesShadersStoreWGSL[r]=o);
