globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as o}from"./chunk-HTIJ5P5S.js";var e="fogFragment",r=`#ifdef FOG
float fog=CalcFogFactor();
#ifdef PBR
fog=toLinearSpace(fog);
#endif
color.rgb=mix(vFogColor,color.rgb,fog);
#endif
`;o.IncludesShadersStore[e]||(o.IncludesShadersStore[e]=r);
