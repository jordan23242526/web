require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const cache = new NodeCache({ stdTTL: 60 * 8 });
const PORT = process.env.PORT || 3000;

const BANKS = process.env.BANKS ? process.env.BANKS.split(',') : ['BCP','BBVA','Interbank','Scotiabank','Pichincha','BanBif','Banco de la Nación','GNB','Banco Falabella'];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const limiter = rateLimit({ windowMs: 60*1000, max: 60 });
app.use(limiter);

app.get('/', (req,res)=>res.json({ ok:true, now: new Date().toISOString() }));

app.get('/api/retasas', async (req,res)=>{
  try{
    const cached = cache.get('retasas_bancos');
    if(cached) return res.json(cached);

    const sbsUrl = 'https://www.sbs.gob.pe/app/retasas/paginas/retasasInicio.aspx?p=D';
    const html = (await axios.get(sbsUrl, { timeout: 15000 })).data;
    const $ = cheerio.load(html);

    const rows = [];
    $('table').each((ti, table) => {
      $(table).find('tbody tr').each((i, el) => {
        const tds = $(el).find('td');
        if(tds.length < 3) return;
        let entidad = $(tds[0]).text().trim();
        let producto = $(tds[1]).text().trim();
        let tasaText = $(tds[2]).text().trim();
        const m = tasaText.match(/[\d,.]+/);
        const tasa = m ? parseFloat(m[0].replace(',', '.')) : NaN;
        if(!entidad || !producto || !isFinite(tasa)) return;
        const matchBank = BANKS.find(b => entidad.toLowerCase().includes(b.toLowerCase()));
        if(!matchBank) return;
        rows.push({
          entidad,
          producto,
          tipo: /dep[oó]sito|ahorro/i.test(producto)?'Pasiva':'Activa',
          tasa: Math.round(tasa*100)/100,
          actualizado: new Date().toISOString().slice(0,10),
          fuente: sbsUrl
        });
      });
    });

    const uniq = [];
    const seen = new Set();
    rows.forEach(r=>{ const key=(r.entidad+'|'+r.producto).toLowerCase(); if(!seen.has(key)){ seen.add(key); uniq.push(r); } });

    cache.set('retasas_bancos', uniq);
    return res.json(uniq);
  }catch(err){
    console.error('Error scraping SBS:', err.message||err);
    return res.status(500).json({ error: 'fallo al obtener datos', details: err.message||String(err) });
  }
});

app.listen(PORT, ()=>console.log('Retasas API corriendo en port', PORT));
