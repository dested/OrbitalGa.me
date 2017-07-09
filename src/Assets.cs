//THIS FILE IS AUTO GENERATED
using Engine.Interfaces;
using System.Collections.Generic;

namespace OrbitalCrash
{
    public class Assets 
    {
        public static void LoadAssets(IRenderer renderer, AssetManager assetManager)
        {
Assets.Images.Landing.HelloWorld = assetManager.CreateImage("images/Landing/hello-world");
Assets.Images.Landing.Welcome = assetManager.CreateImage("images/Landing/welcome");


        }
    






public static class Images {
public static class Landing {
public static IImage HelloWorld {get;set;}
public static IImage Welcome {get;set;}
}
}

 
    }
}