globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var o="sceneUboDeclaration",n=`struct Scene {viewProjection : mat4x4<f32>,
#ifdef MULTIVIEW
viewProjectionR : mat4x4<f32>,
#endif 
view : mat4x4<f32>,
projection : mat4x4<f32>,
vEyePosition : vec4<f32>,};
#define SCENE_UBO
var<uniform> scene : Scene;
`;e.IncludesShadersStoreWGSL[o]||(e.IncludesShadersStoreWGSL[o]=n);
