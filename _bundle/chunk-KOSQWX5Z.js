globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var o="sceneUboDeclaration",t=`layout(std140,column_major) uniform;uniform Scene {mat4 viewProjection;
#ifdef MULTIVIEW
mat4 viewProjectionR;
#endif 
mat4 view;mat4 projection;vec4 vEyePosition;};
`;e.IncludesShadersStore[o]||(e.IncludesShadersStore[o]=t);
