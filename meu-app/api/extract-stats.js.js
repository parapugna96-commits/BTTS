// api/extract-stats.js

export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Apenas POST permitido' });
  }

  try {
    const { jogos } = req.body;
    if (!jogos || !Array.isArray(jogos)) {
      return res.status(400).json({ error: 'Jogos inválidos' });
    }

    const resultados = [];

    for (let jogo of jogos) {
      const { mandante, visitante, liga } = jogo;
      const codigoLiga = mapLiga(liga);

      if (!codigoLiga) {
        resultados.push({
          mandante, visitante, liga,
          mandante_stats: null,
          visitante_stats: null,
          erro: 'Liga não mapeada'
        });
        continue;
      }

      // Buscar stats do mandante (em casa)
      try {
        const mandante_stats = await fetchTeamStats(codigoLiga, mandante);
        const visitante_stats = await fetchTeamStats(codigoLiga, visitante);

        resultados.push({
          mandante,
          visitante,
          liga,
          mandante_stats,
          visitante_stats
        });
      } catch (e) {
        resultados.push({
          mandante, visitante, liga,
          mandante_stats: null,
          visitante_stats: null,
          erro: e.message
        });
      }
    }

    return res.status(200).json({ resultados });
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function fetchTeamStats(codigoLiga, nomeTime) {
  // Buscar a página de stats do time
  const url = `https://www.soccerstats.com/teamstats.asp?league=${codigoLiga}&team=${encodeURIComponent(nomeTime)}`;
  
  const response = await fetch(url);
  const html = await response.text();

  // Extrai percentuais da página
  const stats = {
    marca: extrairStat(html, 'Scored'),
    sofre: extrairStat(html, 'Conceded'),
    btts: extrairStat(html, 'Both Teams Scored'),
    sbh: extrairStat(html, 'Scored Both Halves'),
    cbh: extrairStat(html, 'Conceded Both Halves'),
    over25: extrairStat(html, 'Over 2.5')
  };

  return stats;
}

function extrairStat(html, label) {
  // Procura pelo label e extrai o percentual
  const regex = new RegExp(`${label}[^%]*?(\\d+)%`, 'i');
  const match = html.match(regex);
  return match ? match[1] + '%' : null;
}

function mapLiga(liga) {
  const mapa = {
    'liga brasil': 'brazil',
    'liga brasil 2': 'brazil2',
    'liga itália': 'italy',
    'liga italia': 'italy',
    'liga itália 2': 'italy2',
    'liga italia 2': 'italy2',
    'liga inglaterra': 'england',
    'liga inglaterra 2': 'england2',
    'liga espanha': 'spain',
    'liga españa': 'spain',
    'liga espanha 2': 'spain2',
    'liga españa 2': 'spain2',
    'liga alemanha': 'germany',
    'liga alemania': 'germany',
    'liga alemanha 2': 'germany2',
    'liga alemania 2': 'germany2',
    'liga franca': 'france',
    'liga frança': 'france',
    'liga franca 2': 'france2',
    'liga frança 2': 'france2',
    'liga portugal': 'portugal',
    'liga portugal 2': 'portugal2',
    'liga polônia': 'poland',
    'liga polonia': 'poland',
    'liga holanda': 'netherlands',
    'liga bélgica': 'belgium',
    'liga belgica': 'belgium',
    'liga turquia': 'turkey',
    'liga turquía': 'turkey',
    'liga grécia': 'greece',
    'liga grecia': 'greece',
    'liga escocia': 'scotland',
    'liga escócia': 'scotland',
    'liga argentina': 'argentina',
    'liga lituânia': 'lithuania',
    'liga lituania': 'lithuania'
  };
  return mapa[liga.toLowerCase()] || null;
}
