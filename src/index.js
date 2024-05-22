import { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } from 'discord.js';
import DisTube from 'distube';
import express from "express";
import * as dotenv from 'dotenv';
import anime from "random-anime";

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

const distube = new DisTube.default(client, {
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

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const commands = [
        {
            name: 'help',
            description: 'Show help message',
        },
        {
            name: 'yt',
            description: 'Music commands',
            options: [
                {
                    type: 1, // Subcommand
                    name: 'play',
                    description: 'Play a song',
                    options: [
                        {
                            type: 3, // String
                            name: 'query',
                            description: 'The song name or URL',
                            required: true,
                        },
                    ],
                },
                {
                    type: 1, // Subcommand
                    name: 'np',
                    description: 'Show now playing song',
                },
                {
                    type: 1, // Subcommand
                    name: 'repeat',
                    description: 'Toggle repeat mode',
                },
                {
                    type: 1, // Subcommand
                    name: 'stop',
                    description: 'Stop the music',
                },
                {
                    type: 1, // Subcommand
                    name: 'q',
                    description: 'Show the queue',
                },
                {
                    type: 1, // Subcommand
                    name: 'vol',
                    description: 'Change the volume',
                    options: [
                        {
                            type: 4, // Integer
                            name: 'level',
                            description: 'Volume level (0-100)',
                            required: true,
                        },
                    ],
                },
                {
                    type: 1, // Subcommand
                    name: 'skip',
                    description: 'Skip the current song',
                },
            ],
        },
        {
            name: 'anime',
            description: 'Get a random anime image',
            options: [
                {
                    type: 3, // String
                    name: 'category',
                    description: 'The category of anime images (SFW or NSFW)',
                    required: true,
                    choices: [
                        {
                            name: 'SFW',
                            value: 'sfw',
                        },
                        {
                            name: 'NSFW',
                            value: 'nsfw',
                        },
                    ],
                },
            ],
        },
        {
            name: 't',
            description: 'T command',
            options: [
                {
                    type: 3, // String
                    name: 'symbol',
                    description: 'The symbol',
                    required: true,
                },
            ],
        },
    ];

    const rest = new REST({ version: '9' }).setToken(process.env.token);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    switch (commandName) {
        case 'help':
            const helpEmbed = new EmbedBuilder()
            .setTitle('Help - Command List')
            .setDescription('Use the following commands to interact with the bot:')
            .addFields(
                { name: 'Anime Commands', value: 'Get random anime images', inline: false },
                { name: '`/anime <category>`', value: 'Categories: NSFW 🔥, SFW 😊', inline: true },
                { name: '\u200B', value: '\u200B', inline: false }, // Blank field for spacing
                { name: 'News Commands', value: 'Get the latest news', inline: false },
                { name: '`/news <QUERY>`', value: 'Search for news articles by query', inline: true },
                { name: '\u200B', value: '\u200B', inline: false }, // Blank field for spacing
                { name: 'Music Commands', value: 'Control music playback', inline: false },
                { name: '`/yt play <URL|Song name>`', value: 'Play a song', inline: true },
                { name: '`/yt np`', value: 'Show now playing song', inline: true },
                { name: '`/yt loop`', value: 'Toggle loop mode', inline: true },
                { name: '`/yt repeat`', value: 'Toggle repeat mode', inline: true },
                { name: '`/yt stop`', value: 'Stop the music', inline: true },
                { name: '`/yt skip`', value: 'Skip the current song', inline: true },
                { name: '\u200B', value: '\u200B', inline: false }, // Blank field for spacing
                { name: 'Trade Commands', value: 'Get trading information', inline: false },
                { name: '`/t <symbol>`', value: 'Get information for a specific symbol', inline: true }
            )
            .setFooter({ text: 'Bot created by YourName', iconURL: 'https://yourimageurl.com/logo.png' })
            .setColor('BLUE')
            .setThumbnail('https://yourimageurl.com/help-icon.png');

        await interaction.reply({ embeds: [helpEmbed] });
        break;

        case 'yt':
            const subCommand = options.getSubcommand();

            if (!interaction.member.voice.channel) {
                const joinEmbed = new EmbedBuilder()
                    .setDescription('Please join a voice channel first.');
                return await interaction.reply({ embeds: [joinEmbed], ephemeral: true });
            }

            try {
                switch (subCommand) {
                    case 'play':
                        const query = options.getString('query');
                        await distube.play(interaction.member.voice.channel, query, { message: interaction });
                        await interaction.reply(`Playing \`${query}\``);
                        break;
                    case 'np':
                        const queue = distube.getQueue(interaction);
                        if (!queue) {
                            const noPlayEmbed = new EmbedBuilder()
                                .setDescription('Nothing is playing right now!');
                            await interaction.reply({ embeds: [noPlayEmbed] });
                        } else {
                            const npEmbed = new EmbedBuilder()
                                .setTitle('Now Playing')
                                .setDescription(`${queue.songs.map((song, id) => `**${id ? id === 1 ? 'next' : id - 1 : 'Playing'}**. ${song.name} - \`${song.formattedDuration}\``).join('\n')}`);
                            await interaction.reply({ embeds: [npEmbed] });
                        }
                        break;
                    case 'repeat':
                        const mode = distube.setRepeatMode(interaction);
                        const repeatEmbed = new EmbedBuilder()
                            .setDescription(`Set repeat mode to \`${mode ? mode === 2 ? 'All Queue' : 'This Song' : 'Off'}\``);
                        await interaction.reply({ embeds: [repeatEmbed] });
                        break;
                    case 'stop':
                        distube.stop(interaction);
                        const stopEmbed = new EmbedBuilder()
                            .setDescription('Stopped the music!');
                        await interaction.reply({ embeds: [stopEmbed] });
                        break;
                    case 'q':
                        const queueEmbed = new EmbedBuilder()
                            .setTitle('Current Queue')
                            .setDescription(distube.getQueue(interaction).songs.map((song, id) => `**${id + 1}**. ${song.name} - \`${song.formattedDuration}\``).join('\n'));
                        await interaction.reply({ embeds: [queueEmbed] });
                        break;
                    case 'vol':
                        const volume = options.getInteger('level');
                        if (isNaN(volume) || volume < 0 || volume > 100) {
                            const invalidVolEmbed = new EmbedBuilder()
                                .setDescription('Please provide a valid volume level (0-100).');
                            return await interaction.reply({ embeds: [invalidVolEmbed], ephemeral: true });
                        }
                        distube.setVolume(interaction, volume);
                        const volEmbed = new EmbedBuilder()
                            .setDescription(`Volume set to ${volume}`);
                        await interaction.reply({ embeds: [volEmbed] });
                        break;
                    case 'skip':
                        const queueSkip = distube.getQueue(interaction);
                        if (!queueSkip) {
                            const noQueueEmbed = new EmbedBuilder()
                                .setDescription('No songs in the queue to skip!');
                            await interaction.reply({ embeds: [noQueueEmbed] });
                        } else {
                            distube.skip(interaction);
                            const skipEmbed = new EmbedBuilder()
                                .setDescription('Skipped the song!');
                            await interaction.reply({ embeds: [skipEmbed] });
                        }
                        break;
                }
            } catch (error) {
                console.error(error);
                const errorEmbed = new EmbedBuilder()
                    .setDescription('An error occurred while processing your command.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            break;

        case 'anime':
            const category = options.getString('category');
            let animeImageUrl;

            if (category === 'sfw') {
                animeImageUrl = anime.anime();
            } else if (category === 'nsfw') {
                animeImageUrl = anime.nsfw();
            }

            const animeEmbed = new EmbedBuilder()
                .setTitle(`Random Anime Image (${category.toUpperCase()})`)
                .setImage(animeImageUrl)
                .setColor(category === 'sfw' ? 'BLUE' : 'RED');

            await interaction.reply({ embeds: [animeEmbed] });
            break;

        case 't':
            const symbol = options.getString('symbol');
            // Add your 't' command functionality here
            break;
    }
});

distube.on('playSong', (queue, song) => {
    const playSongEmbed = new EmbedBuilder()
        .setTitle('Now Playing')
        .setDescription(`**${song.name}**`)
        .setThumbnail(song.thumbnail);
    queue.textChannel.send({ embeds: [playSongEmbed] });
});

distube.on('addSong', (queue, song) => {
    const addSongEmbed = new EmbedBuilder()
        .setDescription(`Added **${song.name}** to the queue`)
        .setThumbnail(song.thumbnail);
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

app.listen(8080, () => {
    client.login(process.env.token);
});
