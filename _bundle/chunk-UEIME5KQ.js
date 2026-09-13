globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a}from"./chunk-HTIJ5P5S.js";var r="shadowMapFragmentSoftTransparentShadow",o=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x*alpha) {discard;}
#endif
`;a.IncludesShadersStoreWGSL[r]||(a.IncludesShadersStoreWGSL[r]=o);var t={name:r,shader:o};export{t as a};
