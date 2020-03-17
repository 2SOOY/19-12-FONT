const express = require('express');
const fs = require('fs');
const fse = require('fs-extra');
const gracefulFs = require('graceful-fs')
const router = express.Router();
const execSync = require('child_process');

const PNG = require('pngjs').PNG;
const svgicons2svgfont = require('svgicons2svgfont');
const svg2ttf = require('svg2ttf');
const ImageTracer = require('./public/javascript/imagetracer_v1.2.1');
const fontStream = new svgicons2svgfont({
    fontName: 'myfont'
})

const option = {
    'ltres': 1,
    'qtres': 1,
    'strokewidth': 0.5,
    'pathomit': 8,
    'blurradius': 0,
    'blurdelta': 10
};

option.pal = [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }];
option.linefilter = true;

gracefulFs.gracefulify(fs);

router.post('/', (req, res) => {
    //start
    let doing_training = false;
    let training_progress = [];
    const root_dir = 'font_python/' + +new Date();
    const scan_dir = root_dir + '/scanned_image';
    const crop_dir = root_dir + '/cropped_image';
    const sample_dir = root_dir + '/sample_image';
    const data_dir = root_dir + '/data';
    const model_dir = root_dir + '/checkpoint';
    const logs_dir = root_dir + '/logs'
    const result_dir = root_dir + '/result';

    const svg_dir = root_dir + '/svg'
    const svg_fonts_dir = root_dir + '/svg_fonts'
    const ttf_dir = root_dir + '/ttf_fonts'

    if (!fs.existsSync(root_dir)){
        fs.mkdirSync(root_dir)
    }
    
    if (!fs.existsSync(scan_dir)){
        fs.mkdirSync(scan_dir)
    }
    
    // if (!fs.existsSync(result_dir)){
    //     fs.mkdirSync(result_dir)
    // }
    
    if (!fs.existsSync(svg_dir)) {
        fs.mkdirSync(svg_dir)
    }
    
    if (!fs.existsSync(svg_fonts_dir)) {
        fs.mkdirSync(svg_fonts_dir)
    }
    
    if (!fs.existsSync(ttf_dir)) {
        fs.mkdirSync(ttf_dir)
    }
    
    if (!fs.existsSync(logs_dir)) {
        fs.mkdirSync(logs_dir)
    }

    fse.copySync('./font_python/baseline', `${root_dir}/`)
    // fse.copySync('./public/uploads', `${scan_dir}`)
    
    fs.closeSync(fs.openSync(`${logs_dir}/progress`, 'w'));
 
    execSync(`cp ./public/uploads/* ${scan_dir}`);
    training_progress.push("image uploaded");

    execSync(`python2 ./font_python/01_crop.py --src_dir=${scan_dir} --dst_dir=${crop_dir} --txt=./font_python/399-uniform.txt`);
    training_progress.push("image cropped");
    
    execSync(`python2 ./font_python/02_font2image.py --src_font=./font_python/NanumGothic.ttf --dst_font=./font_python/NanumGothic.ttf --sample_dir=${sample_dir} --handwriting_dir=${crop_dir}`);
    training_progress.push("image created");
    
    execSync(`python2 ./font_python/03_package.py --dir=${sample_dir} --save_dir=${data_dir}`)
    training_progress.push("data compressed");
    
    execSync(`python2 ./font_python/04_train.py --experiment_dir=${root_dir} --experiment_id=0 --batch_size=16 --lr=0.001 --epoch=60 --sample_steps=100 --schedule=20 --L1_penalty=100 --Lconst_penalty=15 --freeze_encoder=1`);
    training_progress.push("first trained");
    
    execSync(`python2 ./font_python/04_train.py --experiment_dir=${root_dir} --experiment_id=0 --batch_size=16 --lr=0.001 --epoch=120 --sample_steps=100 --schedule=30 --L1_penalty=500 --Lconst_penalty=1000 --freeze_encoder=1`);
    training_progress.push("secondPhaseTrained");

    execSync(`python2 ./font_python/05_infer.py --model_dir=${model_dir} --batch_size=1 --source_obj=${data_dir}/val.obj --embedding_ids=0 --save_dir=${result_dir} --progress_file=${logs_dir}/progress`);
    training_progress.push("Inference");
    

    var sources = [];
    var fileName = [];
    const files = fs.readdirSync(`${result_dir}`);


    for (var i = 0; i < files.length; i++) {
        sources[i] = '0x' + files[i].substring(9, 13);
        fileName[i] = files[i].substring(9, 13);
    }

    // png to svg
    for (var i = 0; i < files.length; i++) {
        let j = i;

        var data = fs.readFileSync(`${result_dir}/inferred_` + fileName[j] + '.png');

        var png = PNG.sync.read(data);

        var myImageData = { width: 128, height: 128, data: png.data };
        var options = { ltres: option.ltres, strokewidth: option.strokewidth, qtres: option.qtres, pathomit: option.pathomit, blurradius: option.blurradius, blurdelta: option.blurdelta };

        options.pal = [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }];
        options.linefilter = true;

        var svgstring = ImageTracer.imagedataToSVG(myImageData, options);

        fs.writeFileSync(`${svg_dir}/` + fileName[j] + '.svg', svgstring);
    }

    fontStream.pipe(fs.createWriteStream(`${svg_fonts_dir}/font.svg`))
        .on('finish', function () {
            var ttf = svg2ttf(fs.readFileSync(`${svg_fonts_dir}/font.svg`, 'utf8'), {});
            fs.writeFileSync(`${ttf_dir}/myfont.ttf`, new Buffer(ttf.buffer));
        })
        .on('error', function (err) {
            console.log(err);
        });

    for (var i = 0; i < sources.length; i++) {
        let glyph1 = fs.createReadStream(`${svg_dir}/` + fileName[i] + '.svg');
        glyph1.metadata = {
            unicode: [String.fromCharCode((sources[i]).toString(10))],
            name: 'uni' + sources[i]
        };

        fontStream.write(glyph1);
    }
    fontStream.end();
    res.end('font created')
})


router.get('/', (req, res) => {
   res.render('progress') 
});


module.exports = router;
