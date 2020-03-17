var express = require('express');
var router = express.Router();
const { exec, execSync, spawn } = require('child_process');

var ImageTracer = require('./public/javascript/imagetracer_v1.2.1');

var fs = require('fs');
var gracefulFs = require('graceful-fs')
gracefulFs.gracefulify(fs)

var svg2ttf = require('svg2ttf');

var svgicons2svgfont = require('svgicons2svgfont');

var fontStream = new svgicons2svgfont({
    fontName: '_FONT'
})

var PNG = require('pngjs').PNG;

var dir_name = 'FONT'
// var dir_name = +new Date()

var img_dir = `./${dir_name}`
if (!fs.existsSync(img_dir)){
    fs.mkdirSync(img_dir)
}

var svg_dir = img_dir + '/svg'
if (!fs.existsSync(svg_dir)){
    fs.mkdirSync(svg_dir)
}

var svg_fonts_dir = img_dir + '/svg_fonts'
if (!fs.existsSync(svg_fonts_dir)){
    fs.mkdirSync(svg_fonts_dir)
}

var ttf_dir = img_dir + '/ttf_fonts'
if (!fs.existsSync(ttf_dir)){
    fs.mkdirSync(ttf_dir)
}

var files = fs.readdirSync(`./${dir_name}/flipped_result`);

var option = {    
        'ltres' : 1,
        'qtres' : 1,
        'strokewidth' : 0.5,
        'pathomit' : 8,
        'blurradius' : 0,
        'blurdelta' : 10 
    };

option.pal = [{r:0,g:0,b:0,a:255},{r:255,g:255,b:255,a:255}];
option.linefilter=true;

var app = function generate()
{
    var sources = [];
    var fileName = [];

    for(var i=0; i<files.length; i++) {
    sources[i] = '0x' + files[i].substring(9,13);
    fileName[i] = files[i].substring(9,13);
    // 숫자, 영어
    if (files[i].length === 14){
        console.log(files[i])
        sources[i] = '0x' + (files[i].substring(9, 10).charCodeAt(0).toString(16));
        fileName[i] = files[i].substring(9, 10);
    }

    }
      // png to svg
      for(var i=0; i<files.length; i++) {
            let j = i;

            var data = fs.readFileSync(__dirname+`/${dir_name}/flipped_result/inferred_`+fileName[j]+'.png');

            var png = PNG.sync.read(data);

            var myImageData = {width:png.width, height:png.height, data:png.data};
            var options = {ltres:option.ltres, strokewidth:option.strokewidth, qtres:option.qtres, pathomit:option.pathomit, blurradius:option.blurradius, blurdelta:option.blurdelta};

            options.pal = [{r:0,g:0,b:0,a:255},{r:255,g:255,b:255,a:255}];
            options.linefilter=true;
            
            var svgstring = ImageTracer.imagedataToSVG( myImageData, options);

            fs.writeFileSync(`./${dir_name}/svg/` + fileName[j] + '.svg', svgstring);
    }

    fontStream.pipe(fs.createWriteStream( `./${dir_name}/svg_fonts/font_ss.svg`))
    .on('finish',function() {
        var ttf = svg2ttf(fs.readFileSync( `./${dir_name}/svg_fonts/font_ss.svg`, 'utf8'), {});
        fs.writeFileSync(`./${dir_name}/ttf_fonts/${dir_name}.ttf`, new Buffer(ttf.buffer));
    })
    .on('error',function(err) {
        console.log(err);
    });

    for (var i=0; i < sources.length; i++) {
        
        let glyph1 = fs.createReadStream(`./${dir_name}/svg/` + fileName[i] + '.svg');
        glyph1.metadata = {
        unicode: [String.fromCharCode((sources[i]).toString(10))],
        name: 'uni' + sources[i]
        };

        fontStream.write(glyph1);
    }
    fontStream.end();
}

app();