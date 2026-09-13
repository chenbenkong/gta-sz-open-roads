globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var d="bumpVertexDeclaration",n=`#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL) 
varying vTBN0: vec3f;varying vTBN1: vec3f;varying vTBN2: vec3f;
#endif
#endif
`;e.IncludesShadersStoreWGSL[d]||(e.IncludesShadersStoreWGSL[d]=n);
