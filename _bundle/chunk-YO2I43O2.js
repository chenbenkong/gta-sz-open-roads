globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var i="pickingPixelShader",r=`#if defined(INSTANCES)
flat varying vMeshID: f32;
#else
uniform meshID: f32;
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var id: i32;
#if defined(INSTANCES)
id=i32(input.vMeshID);
#else
id=i32(uniforms.meshID);
#endif
var color=vec3f(
f32((id>>16) & 0xFF),
f32((id>>8) & 0xFF),
f32(id & 0xFF),
)/255.0;fragmentOutputs.color=vec4f(color,1.0);}
`;e.ShadersStoreWGSL[i]||(e.ShadersStoreWGSL[i]=r);var f={name:i,shader:r};export{f as a};
