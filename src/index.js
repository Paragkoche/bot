import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import DisTube from 'distube';
import express from "express"
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const distube = new DisTube(client, {
    searchSongs: 1,
    searchCooldown: 30,
    leaveOnEmpty: true,
    emptyCooldown: 0,
    leaveOnFinish: true,
    leaveOnStop: true,
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25, // 32MB
    },
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
                const joinEmbed = new EmbedBuilder()
                    .setDescription('Please join a voice channel first.');
                return await message.channel.send({ embeds: [joinEmbed] });
            }

            try {
                switch (subCommand) {
                    case 'play':
                        await distube.play(message.member.voice.channel, query, { message });
                        break;
                    case 'np':
                        const queue = distube.getQueue(message);
                        if (!queue) {
                            const noPlayEmbed = new EmbedBuilder()
                                .setDescription('Nothing is playing right now!');
                            await message.channel.send({ embeds: [noPlayEmbed] });
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
                        const repeatEmbed = new EmbedBuilder()
                            .setDescription(`Set repeat mode to \`${mode ? mode === 2 ? 'All Queue' : 'This Song' : 'Off'}\``);
                        await message.channel.send({ embeds: [repeatEmbed] });
                        break;
                    case 'stop':
                        distube.stop(message);
                        const stopEmbed = new EmbedBuilder()
                            .setDescription('Stopped the music!');
                        await message.channel.send({ embeds: [stopEmbed] });
                        break;
                    case 'vol':
                        const volume = parseInt(args[0], 10);
                        distube.setVolume(message, volume);
                        const volEmbed = new EmbedBuilder()
                            .setDescription(`Volume set to ${volume}`);
                        await message.channel.send({ embeds: [volEmbed] });
                        break;
                    case 'skip':
                    case 'next':
                        distube.skip(message);
                        const skipEmbed = new EmbedBuilder()
                            .setDescription('Skipped the song!');
                        await message.channel.send({ embeds: [skipEmbed] });
                        break;
                }
            } catch (error) {
                console.error(error);
                const errorEmbed = new EmbedBuilder()
                    .setDescription('An error occurred while processing your command.');
                await message.channel.send({ embeds: [errorEmbed] });
            }
            break;
        case 't':
            // Add your 't' command functionality here
            break;
    }
});

distube.on('playSong', (queue, song) => {
    const playSongEmbed = new EmbedBuilder()
        .setDescription(`Playing **${song.name}**`);
    queue.textChannel.send({ embeds: [playSongEmbed] });
});

distube.on('addSong', (queue, song) => {
    const addSongEmbed = new EmbedBuilder()
        .setDescription(`Added **${song.name}** to the queue`);
    queue.textChannel.send({ embeds: [addSongEmbed] });
});

distube.on('empty', (queue) => {
    const emptyEmbed = new EmbedBuilder()
        .setDescription('Channel is empty. Leaving the channel.');
    queue.textChannel.send({ embeds: [emptyEmbed] });
});

distube.on('searchNoResult', (message, query) => {
    const noResultEmbed = new EmbedBuilder()
        .setDescription(`No result found for ${query}!`);
    message.channel.send({ embeds: [noResultEmbed] });
});

const app = express();

app.listen(8080,()=>{

    client.login(process.env.token);
})
