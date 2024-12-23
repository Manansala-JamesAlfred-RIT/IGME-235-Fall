WebFont.load({
    google: {
        families: ['Space Mono']
    },
    active: e => {
        // console.log("font loaded!");
        // pre-load the images
        app.loader.
            add([
                "images/spaceship.png",
                "images/explosions.png",
                "images/space_shuttle.png",
                "images/ufodark.png",
                "images/torpedodark.png",
                "images/starshipdark.png"
                
            ]);
        // app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
        app.loader.onComplete.add(setup);
        app.loader.load();
    }
});