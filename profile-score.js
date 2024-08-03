const axios = require('axios');

const BRAWL_STARS_API_KEY = process.env.BRAWL_STARS_API_KEY;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { tag } = req.query;

    if (!tag) {
        return res.status(400).json({ message: 'Player tag is required' });
    }

    try {
        const response = await axios.get(`https://api.brawlstars.com/v1/players/%23${tag}`, {
            headers: {
                'Authorization': `Bearer ${BRAWL_STARS_API_KEY}`,
            },
        });

        const playerData = response.data;
        const profileScore = calculateProfileScore(playerData);

        res.json({
            profileScore,
            trophies: playerData.trophies,
            highestTrophies: playerData.highestTrophies,
            threevs3Victories: playerData['3vs3Victories'],
            soloVictories: playerData.soloVictories,
            duoVictories: playerData.duoVictories,
            brawlers: playerData.brawlers.length,
            topBrawlers: playerData.brawlers
                .sort((a, b) => b.trophies - a.trophies)
                .slice(0, 7)
                .map(brawler => ({
                    name: brawler.name,
                    trophies: brawler.trophies,
                    power: brawler.power
                }))
        });
    } catch (error) {
        console.error('Error fetching player data:', error);
        res.status(500).json({ message: 'Failed to fetch player data' });
    }
};

function calculateProfileScore(playerData) {
    const currentTrophies = playerData.trophies;
    const totalVictories = playerData['3vs3Victories'] + playerData.soloVictories + playerData.duoVictories;

    // Sort brawlers by trophies in descending order and get top 7
    const top7Brawlers = playerData.brawlers
        .sort((a, b) => b.trophies - a.trophies)
        .slice(0, 7);

    const top7TrophiesSum = top7Brawlers.reduce((sum, brawler) => sum + brawler.trophies, 0);
    const top7PowerLevelSum = top7Brawlers.reduce((sum, brawler) => sum + brawler.power, 0);

    const score = (
        (currentTrophies / 10) +
        (currentTrophies / (totalVictories || 1)) + // Avoid division by zero
        top7TrophiesSum +
        top7PowerLevelSum
    );

    return Math.round(score);
}
