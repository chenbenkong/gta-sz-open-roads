globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as o}from"./chunk-HTIJ5P5S.js";var a="gaussianSplattingFragmentDeclaration",n=`vec4 gaussianColor(vec4 inColor)
{float A=-dot(vPosition,vPosition);if (A<-4.0) discard;float B=exp(A)*inColor.a;
#include<logDepthFragment>
vec3 color=inColor.rgb;
#ifdef FOG
#include<fogFragment>
#endif
return vec4(color,B);}
`;o.IncludesShadersStore[a]||(o.IncludesShadersStore[a]=n);var e="gaussianSplattingPixelShader",i=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
varying vec4 vColor;varying vec2 vPosition;
#define CUSTOM_FRAGMENT_DEFINITIONS
#include<gaussianSplattingFragmentDeclaration>
void main () {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec4 finalColor=gaussianColor(vColor);
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
gl_FragColor=finalColor;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;o.ShadersStore[e]||(o.ShadersStore[e]=i);var f={name:e,shader:i};export{f as a};
