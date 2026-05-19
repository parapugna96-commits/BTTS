// api/extract-stats.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ resultados: [] });
  }

  try {
    const { jogos } = req.body;

    if (!Array.isArray(jogos)) {
      return res.status(200).json({ resultados: [] });
    }

    const resultados = [];

    for (const jogo of jogos) {
      const ligaCod = mapLiga(jogo.liga);

      if (!ligaCod) {
        resultados.push({
          mandante: jogo.mandante,
          visitante: jogo.visitante,
          liga: jogo.liga,
          mandante_stats: null,
          visitante_stats: null,
          erro: 'Liga não encontrada'
        });
        continue;
      }

      try {
        const m_stats = await getTeamStats(jogo.mandante, ligaCod);
        const v_stats = await getTeamStats(jogo.visitante, ligaCod);

        resultados.push({
          mandante: jogo.mandante,
          visitante: jogo.visitante,
          liga: jogo.liga,
          mandante_stats: m_stats || {},
          visitante_stats: v_stats || {}
        });
      } catch (err) {
        resultados.push({
          mandante: jogo.mandante,
          visitante: jogo.visitante,
          liga: jogo.liga,
          mandante_stats: null,
          visitante_stats: null,
          erro: 'Dados indisponíveis'
        });
      }
    }

    return res.status(200).json({ resultados });
  } catch (error) {
    return res.status(200).json({ resultados: [], error: error.message });
  }
}

async function getTeamStats(teamName, leagueCode) {
  try {
    const url = `https://www.soccerstats.com/team.asp?league=${leagueCode}&team=${encodeURIComponent(teamName)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();

    const stats = {
      marca: findStat(html, 'Scored'),
      sofre: findStat(html, 'Conceded'),
      btts: findStat(html, 'Both Teams Scored'),
      sbh: findStat(html, 'Scored Both Halves'),
      cbh: findStat(html, 'Conceded Both Halves'),
      over25: findStat(html, 'Over 2.5')
    };

    return stats;
  } catch (e) {
    return null;
  }
}

function findStat(html, label) {
  if (!html) return null;

  const cleaned = html.replace(/\s+/g, ' ');

  const patterns = [
    new RegExp(`${label}[^<]{0,100}(\\d+)\\s*%`, 'i'),
    new RegExp(`>${label}<[^<]{0,200}(\\d+)\\s*%`, 'i'),
    new RegExp(`${label.replace(/\s+/g, '\\s+')}[^0-9]{0,50}(\\d+)\\s*%`, 'i')
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      return match[1] + '%';
    }
  }

  return null;
}

function mapLiga(liga) {
  if (!liga) return null;
  
  const normalized = liga.toLowerCase()
    .replace(/á|à|ã|â/g, 'a')
    .replace(/é|ê/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó|ô|õ/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ç/g, 'c');

  const mapa = {
    'liga brasil': 'brazil',
    'liga brasil 2': 'brazil2',
    'liga italia': 'italy',
    'liga italia 2': 'italy2',
    'liga inglaterra': 'england',
    'liga inglaterra 2': 'england2',
    'liga espanha': 'spain',
    'liga espanha 2': 'spain2',
    'liga alemania': 'germany',
    'liga alemania 2': 'germany2',
    'liga franca': 'france',
    'liga franca 2': 'france2',
    'liga portugal': 'portugal',
    'liga portugal 2': 'portugal2',
    'liga polonia': 'poland',
    'liga holanda': 'netherlands',
    'liga belgica': 'belgium',
    'liga turquia': 'turkey',
    'liga grecia': 'greece',
    'liga escocia': 'scotland',
    'liga argentina': 'argentina',
    'liga lituania': 'lithuania',
    'liga georgia': 'georgia',
    'liga letonia': 'latvia'
  };

  return mapa[normalized] || null;
}
