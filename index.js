const express = require("express");
const fs = require("fs");
const sharp  = require("sharp");
const {Client} = require("pg");
const {exec} =  require('child_process');
const path = require("path");
const formidable = require('formidable');
const crypto = require("crypto")

app = express();

//client = new Client({user:})


const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'alinsava',
    database: 'TehniciWeb',
    port: 5432
})
client.connect()

app.set("view engine", "ejs");

app.use("/Resurse", express.static(__dirname + "/Resurse"));

app.get(["/","/home","/index"], function(req, res){
    console.log(__dirname + "/index.html");
    res.render("Pagini/index", {ip:req.ip, imagini:SelectedImages, imagini_a:UltimeleImagini()});
    //res.sendFile(__dirname + "/index.html");
    
    res.end();

})

// app.get("*/galerie-animata.css", function(req, res)
// {
    
//     console.log("galerie animata apelata prima");
//     var sirScss=fs.readFileSync(__dirname+"/resurse/sass/galerie_animata.scss").toString("utf8");
//     var culori = ["navy", "black", "purple", "grey"];
//     var indiceAleator = Math.floor(Math.random()*culori.length);
//     var culoareAleatoare = culori[indiceAleator];
//     rezScss = ejs.render(sirScss, {culoare: culoareAleatoare});
//     //console.log(rezScss);
//     var caleScss=__dirname+"/temp/galerie_animata.scss";
//     fs.writeFileSync(__dirname+"/temp/galerie_animata.scss", rezScss);
//     try{
//     rezCompilare = sass.compile(caleScss, {sourceMap:true});
//     var caleCss=__dirname+"/temp/galerie_animata.css";
//     fs.writeFileSync(caleCss, rezCompilare.css);
//     res.setHeader("Content-Type", "text/css");
//     res.sendFile(caleCss);
//     }
//     catch(err){
//         console.log(err);
//         res.send("Eroare");
//     }
// })

app.get("/*.ejs",function(req, res){
    RandeazaEroare(res,403);
    res.end();
})

app.post("/inreg", function(req, res){
    string_cr = "abcdefge"; 
    var username;
    let formular= new formidable.IncomingForm();
	//nr ordine: 4
    formular.parse(req, function(err, campuriText){
        console.log(campuriText);
		eroare ="";
		if(campuriText.username=="" || !campuriText.username.match("^[A-Za-z0-9]+$") || !campuriText.username.match(".{1,10}")){
			eroare+="Username invalid. ";
		}
        if(!campuriText.parola.match("^[A-Za-z0-9]*$") || campuriText.parola==""){
            eroare+="Parola invalida. ";
        }
        if(campuriText.parola != campuriText.rparola){
            eroare+="Parolele nu sunt identice! "
        }
        if(campuriText.nume=="" || !campuriText.nume.match("^[A-Za-z]*$")){
            eroare+="Nume invalid. ";
        }
        if(campuriText.prenume=="" || !campuriText.prenume.match("^[A-Za-z]*$")){
            eroare+="Prenume invalid. ";
        }
        if(campuriText.email==""){
            eroare+="Mail invalid. "
        }
		if(!eroare){
			let parolaCriptata= crypto.scryptSync(campuriText.parola, string_cr, 64).toString('hex');
			let comanda= `insert into utilizatori (username, nume, prenume, parola, email, culoare_chat) values ('${campuriText.username}','${campuriText.nume}', '${campuriText.prenume}', '${parolaCriptata}', '${campuriText.email}', '${campuriText.culoare_chat}')`;
			console.log(comanda);
			client.query(comanda, function(err, rez){
				if (err){
					console.log(err);
					res.render("pagini/inregistrare",{err:"Eroare baza date.", raspuns:"Datele nu au fost introdduse."});
				}
				else{
					res.render("pagini/inregistrare",{err:"", raspuns:"Inregistrat cu succes."});
					console.log(campuriText.email);
				}
			});
		}
		else{
					res.render("pagini/inregistrare",{err:"Eroare formular. "+eroare, raspuns:""});
		}
    });
});



app.get("*/galerie_animata.css",function(req, res){

    console.log("galerie animata apelata");
    res.setHeader("Content-Type","text/css");

    exec("sass ./resurse/sass/galerie_animata.scss ./temp/galerie_animata.css", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            res.end();
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            res.end();
            return;
        }
        //console.log(`stdout: ${stdout}`);
        res.sendFile(path.join(__dirname,"temp/galerie_animata.css"));
    });

});



app.get("/*", function(req, res){
    res.render("Pagini" + req.url, function(err, rezRender){
        if(err){
            if(err.message.includes("Failed to lookup view")){
                //res.status(404).render("Pagini/404");
                RandeazaEroare(res,404);
            }
            else
            {
                res.render("pagini/eroare_generala");
            }
        }
        else{
            res.send(rezRender);
        }

    });
    

    res.end();
})

function UltimeleImagini(){
    var textFisier=fs.readFileSync("resurse/json/galerie.json")
	var jsi=JSON.parse(textFisier); 

	var caleGalerie=jsi.cale_galerie;
    console.log(caleGalerie);
    let galeria_animata=[]

    for(let i=jsi.imagini.length-1; i>=0 && galeria_animata.length<14; --i)
    {
        var img = path.join(caleGalerie, jsi.imagini[i].fisier);
        galeria_animata.push({image_src:img, titlu:jsi.imagini[i].titlu, descriere:jsi.imagini[i].descriere})
        
    }
    
    return galeria_animata;
}


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
        //console.log(sfert_ora);
        if(imag.sfert_ora != sfert_ora)
            continue;

        let nume_imag, extensie;
        [nume_imag, extensie ]=imag.fisier.split(".")// "abc.de".split(".") ---> ["abc","de"] imagine.png->imagine.webp
        let dim_mic=150
        
        imag.mic=`${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
        //console.log(imag.mic);

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
    var buf=fs.readFileSync(__dirname+"/Resurse/json/erori.json").toString("utf8");
    obErori=JSON.parse(buf);//global
    
}

function RandeazaEroare(res, identificator, status,titlu, text, imagine){

    var eroare= obErori.erori.find(function(elem){return elem.identificator == identificator});
    titlu= titlu || (eroare && eroare.titlu) || "Titlu eroare custom";
    text= text || (eroare && eroare.text) || "Titlu eroare custom";
    imagine= imagine || (eroare && (obErori.cale_baza+"/"+eroare.imagine)) || "Titlu eroare custom";
    console.log(imagine);
    if(eroare && eroare.status)
        res.status(eroare.identificator);
    res.render("pagini/eroare_generala",{titlu:titlu, text:text, imagine: imagine});
}




creeazaImagini();
creeazaErori();

//console.log(SelectedImages);
//console.log(obImagini);
console.log("O pornit");

//app.listen(8080)

var s_port=process.env.PORT || 8080;
app.listen(s_port);
