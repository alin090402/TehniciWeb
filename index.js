const express = require("express");
//const fs = require("fs");
//const sharp  = require("sharp");

app = express();

app.set("view engine", "ejs");

app.use("/Resurse", express.static(__dirname + "/Resurse"));

app.get(["/","/home","/index"], function(req, res){
    console.log(__dirname + "/index.html");
    res.render("Pagini/index", {ip:req.ip});
    //res.sendFile(__dirname + "/index.html");
    
    res.end();

})

app.get("/*.ejs",function(req, res){
    res.status(403).render("Pagini/403");
    console.log("Accesare nepermisa");
    res.end();
})


app.get("/*", function(req, res){
    res.render("Pagini" + req.url, function(err, rezRender){
        if(err){
            if(err.message.includes("Failed to lookup view")){
                res.status(404).render("Pagini/404");
            }
            else
            {
                res.render("Pagini/ERROR");
            }
        }
        else{
            res.send(rezRender);
        }

    });
    

    res.end();
})

/*
function creeazaImagini(){
    console.log("creare imagini");
    var buf=fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf8");
    obImagini=JSON.parse(buf);//global
    //console.log(obImagini);
    for (let imag of obImagini.imagini){
        let nume_imag, extensie;
        [nume_imag, extensie ]=imag.fisier.split(".")// "abc.de".split(".") ---> ["abc","de"]
        let dim_mic=150
        
        imag.mic=`${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
        //console.log(imag.mic);
        imag.mare=`${obImagini.cale_galerie}/${imag.fisier}`;
        if (!fs.existsSync(imag.mic))
            sharp(__dirname+"/"+imag.mare).resize(dim_mic).toFile(__dirname+"/"+imag.mic);

        
    }

}
creeazaImagini();
*/

console.log("O pornit");

app.listen(8080)