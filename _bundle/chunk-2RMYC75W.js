globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var a="areaLightTextureProcessingPixelShader",r=`uniform sampler2D textureSampler;uniform vec2 scalingRange;varying vec2 vUV;void main(void)
{float x=(vUV.x-scalingRange.x)/(scalingRange.y-scalingRange.x);float y=(vUV.y-scalingRange.x)/(scalingRange.y-scalingRange.x);vec2 scaledUV=vec2(x,y);gl_FragColor=texture2D(textureSampler,scaledUV);}
`;e.ShadersStore[a]||(e.ShadersStore[a]=r);var g={name:a,shader:r};export{g as a};
