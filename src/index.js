import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import DisTube from 'distube';
import express from "express"
const token = process.env.token

const config = {
    prefix: '*',
    token
}
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const distube = new DisTube.default(client, {
    searchSongs: 1,
    searchCooldown: 30,
    leaveOnEmpty: true,
    emptyCooldown: 0,
    leaveOnFinish: true,
    leaveOnStop: true,
    // plugins: [new SoundCloudPlugin.SoundCloudPlugin(), new SpotifyPlugin.SpotifyPlugin()],
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('debug', console.log);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'help':
            const helpEmbed = new EmbedBuilder()
                .setTitle('Help ``Prefix *``')
                .setDescription(`\n **Anime** \n anime <categories> \n **Anime Categories** \n NSFW 🔥\n SFW 😊\n **News** \n news <QUERY> \n **MUSIC** \n yt <command>\n **COMMAND** \n play <URL| Song name>\n np \n loop\n repeat \n stop \n skip \n **TREAD** \n t <symbol>`);
            await message.channel.send({ embeds: [helpEmbed] });
            break;

        case 'yt':
            const subCommand = args.shift();
            const query = args.join(' ');

            if (!message.member.voice.channel) {
                return message.channel.send('Please join a voice channel first.');
            }

            try {
                switch (subCommand) {
                    case 'play':
                        await distube.play(message.member.voice.channel, query, { message });
                        break;
                    case 'np':
                        const queue = distube.getQueue(message);
                        if (!queue) {
                            await message.channel.send('Nothing is playing right now!');
                        } else {
                            const npEmbed = new EmbedBuilder()
                                .setTitle('Now Playing')
                                .setDescription(`${queue.songs.map((song, id) => `**${id ? id === 1 ? 'next' : id - 1 : 'Playing'}**. ${song.name} - \`${song.formattedDuration}\``).join('\n')}`);
                            await message.channel.send({ embeds: [npEmbed] });
                        }
                        break;
                    case 'repeat':
                    case 'loop':
                        const mode = distube.setRepeatMode(message);
                        await message.channel.send(`Set repeat mode to \`${mode ? mode === 2 ? 'All Queue' : 'This Song' : 'Off'}\``);
                        break;
                    case 'stop':
                        distube.stop(message);
                        await message.channel.send('Stopped the music!');
                        break;
                    case 'vol':
                        const volume = parseInt(args[0], 10);
                        distube.setVolume(message, volume);
                        await message.channel.send(`Volume set to ${volume}`);
                        break;
                    case 'skip':
                    case 'next':
                        distube.skip(message);
                        await message.channel.send('Skipped the song!');
                        break;
                }
            } catch (error) {
                console.error(error);
                await message.channel.send('An error occurred while processing your command.');
            }
            break;
        case 't':
            // Add your 't' command functionality here
            break;
    }
});

distube.on('playSong', (queue, song) => {
    queue.textChannel.send(`Playing **${song.name}**`);
});

distube.on('addSong', (queue, song) => {
    queue.textChannel.send(`Added **${song.name}** to the queue`);
});

distube.on('empty', (queue) => {
    queue.textChannel.send('Channel is empty. Leaving the channel.');
});

distube.on('searchNoResult', (message, query) => {
    message.channel.send(`No result found for ${query}!`);
});

const app = express()

app.listen(8080,()=>{
    client.login(token);

})

