using System;
using System.Collections.Generic;
using System.Diagnostics;
using Engine;
using Engine.Interfaces;

namespace OrbitalCrash
{
    public class Game : BaseGame
    {
        private IScreen landingScreen;
        public override void InitScreens(IRenderer renderer)
        {

            int width = 1536;
            int height = 2048;

            landingScreen = ScreenManager.CreateScreen();
            landingScreen
                .CreateLayout(width, height)
                .MakeActive()
                .SetScreenOrientation(ScreenOrientation.Vertical)
                .SetLayout(new LandingAreaLayout(renderer));

            ScreenManager.ChangeScreen(landingScreen);
        }


        public void InitSocketManager(ISocketManager socketManager)
        {
          
        }


        public override void BeforeDraw()
        {
        }

        public override void AfterDraw()
        {
        }


        public override void BeforeTick()
        {
        }

        public override void AfterTick()
        {
        }


        public override void LoadAssets(IRenderer renderer)
        { 
           Assets.LoadAssets(renderer, AssetManager);
        }
    }
}
