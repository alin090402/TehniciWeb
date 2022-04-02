const express = require("express");
const fs = require("fs");
const sharp  = require("sharp");
const {Client} = require("pg");

app = express();

//client = new Client({user:})

app.set("view engine", "ejs");

app.use("/Resurse", express.static(__dirname + "/Resurse"));

app.get(["/","/home","/index"], function(req, res){
    console.log(__dirname + "/index.html");
    res.render("Pagini/index", {ip:req.ip, imagini:SelectedImages});
    //res.sendFile(__dirname + "/index.html");
    
    res.end();

})

app.get("*/galerie-animata.css", function(req, res)
{
    var sirScss=fs.readFileSync(__dirname+"/resurse/resurse/scss/galerie_animata.scss").toString("utf8");
    var culori = ["navy", "black", "purple", "grey"];
    var indiceAleator = Math.floor(Math.random()*culori.length);
    var culoareAleatoare = culori[indiceAleator];
    rezScss = ejs.render(sirScss, {culoare: culoareAleatoare});
    console.log(rezScss);
    var caleScss=__dirname+"/temp/galerie_animata.scss";
    fs.writeFileSync(__dirname+"/temp/galerie_animata.scss", rezScss);
    try{
    rezCompilare = sass.compile(caleScss, {sourceMap:true});
    var caleCss=__dirname+"/temp/galerie_animata.css";
    fs.writeFileSync(caleCss, rezCompilare.css);
    res.setHeader("Content-Type", "text/css");
    res.sendFile(caleCss);
    }
    catch(err){
        console.log(err);
        res.send("Eroare");
    }
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

function creeazaImagini(){
    var buf=fs.readFileSync(__dirname+"/Resurse/Json/galerie.json").toString("utf8");


    obImagini=JSON.parse(buf);//global
    SelectedImages = []


    //console.log(obImagini);
    for (let imag of obImagini.imagini){
        if(SelectedImages.length >= 10)
            break;
        let today = new Date();
        let sfert_ora = Math.floor(today.getMinutes() / 15) + 1;
        console.log(sfert_ora);
        if(imag.sfert_ora != sfert_ora)
            continue;

        let nume_imag, extensie;
        [nume_imag, extensie ]=imag.fisier.split(".")// "abc.de".split(".") ---> ["abc","de"] imagine.png->imagine.webp
        let dim_mic=150
        
        imag.mic=`${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
        //console.log(imag.mic);
        console.log(imag.titlu);

        imag.mare=`${obImagini.cale_galerie}/${imag.fisier}`;
        if (!fs.existsSync(imag.mic))
            sharp(__dirname+"/"+imag.mare).resize(dim_mic).toFile(__dirname+"/"+imag.mic);


        let dim_mediu=300;
        imag.mediu=`${obImagini.cale_galerie}/mediu/${nume_imag}-${dim_mediu}.png` 
        //console.log(imag.mediu);
        if (!fs.existsSync(imag.mediu))
            sharp(__dirname+"/"+imag.mare).resize(dim_mediu).toFile(__dirname+"/"+imag.mediu);
        SelectedImages.push(imag)

        
    }

}
function creeazaErori(){
    var buf=fs.readFileSync(__dirname+"/Resurse/resurse/json/erori.json").toString("utf8");
    obErori=JSON.parse(buf);//global
    console.log(obErori);
}

function RandeazaEroare(identificator, status,titlu, text, imagine){

    var eroare = obErori.erori.find( function(elem) {return elem.identificator == identificator})
    if(status){
        res.status(identificator).render("pagini/eroare_generala", {titlu:eroare.titlu, text:eroare.text, imagine:obErori.caleBaza + "/" + eroare.imagine})
    }
}




creeazaImagini();
creeazaErori();

//console.log(SelectedImages);
//console.log(obImagini);
console.log("O pornit");

app.listen(8080)