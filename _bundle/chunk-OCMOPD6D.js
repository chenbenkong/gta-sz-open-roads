globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var r="displayPassPixelShader",a=`varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D passSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{gl_FragColor=texture2D(passSampler,vUV);}`;e.ShadersStore[r]||(e.ShadersStore[r]=a);var o={name:r,shader:a};export{o as a};
