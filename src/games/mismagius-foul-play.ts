import { ICommandDefinition } from "../command-parser";
import { Player } from "../room-activity";
import { Game } from "../room-game";
import { Room } from "../rooms";
import { IGameFile } from "../types/games";

const name = "Mismagius' Foul Play";
const data: {colors: Dict<string[]>, eggGroups: Dict<string[]>, moves: Dict<string[]>, pokemon: string[], types: Dict<string[]>} = {
	colors: {},
	eggGroups: {},
	moves: {},
	pokemon: [],
	types: {},
};
type Category = Exclude<keyof typeof data, 'pokemon'>;
const dataKeys: {colors: string[], eggGroups: string[], moves: string[], types: string[]} = {
	colors: [],
	eggGroups: [],
	moves: [],
	types: [],
};
const categories: Category[] = ["colors", "eggGroups", "moves", "types"];
let loadedData = false;

class MismagiusFoulPlay extends Game {
	static loadData(room: Room) {
		if (loadedData) return;

		room.say("Loading data for " + name + "...");
		const pokemonList = Dex.getPokemonList(x => !x.isForme && !!x.learnset);
		for (let i = 0; i < pokemonList.length; i++) {
			const pokemon = pokemonList[i];
			data.pokemon.push(pokemon.species);
			if (!(pokemon.color in data.colors)) {
				data.colors[pokemon.color] = [];
				dataKeys.colors.push(pokemon.color);
			}
			data.colors[pokemon.color].push(pokemon.species);
			for (let i = 0; i < pokemon.eggGroups.length; i++) {
				const eggGroup = pokemon.eggGroups[i] + " group";
				if (!(eggGroup in data.eggGroups)) {
					data.eggGroups[eggGroup] = [];
					dataKeys.eggGroups.push(eggGroup);
				}
				data.eggGroups[eggGroup].push(pokemon.species);
			}
			for (let i = 0; i < pokemon.types.length; i++) {
				const type = pokemon.types[i] + " type";
				if (!(type in data.types)) {
					data.types[type] = [];
					dataKeys.types.push(type);
				}
				data.types[type].push(pokemon.species);
			}
			for (const i in pokemon.learnset) {
				const move = Dex.getExistingMove(i);
				if (!(move.name in data.moves)) {
					data.moves[move.name] = [];
					dataKeys.moves.push(move.name);
				}
				data.moves[move.name].push(pokemon.species);
			}
		}

		loadedData = true;
	}

	chosenPokemon = new Map<Player, string>();
	criminalCount: number = 0;
	criminals: Player[] = [];
	decoyPokemon: string[] = [];
	detectiveCount: number = 0;
	detectives: Player[] = [];
	identifications = new Map<Player, number>();
	kidnaps = new Map<Player, number>();
	lastCategory: Category | null = null;
	previousParams: string[] = [];
	roundGuesses = new Map<Player, boolean>();

	onRemovePlayer(player: Player) {
		if (this.criminals.includes(player)) {
			this.criminalCount--;
		} else if (this.detectives.includes(player)) {
			this.detectiveCount--;
		}
	}

	onStart() {
		this.say("Now requesting Pokemon!");
		for (const id in this.players) {
			this.players[id].say("Please select a Pokemon to play as with ``.select``!");
		}
		this.timeout = setTimeout(() => this.chooseCriminals(), 30 * 1000);
	}

	chooseCriminals() {
		const keys = this.shuffle(data.pokemon);
		this.chosenPokemon.forEach((species, player) => {
			keys.splice(keys.indexOf(species));
		});
		for (const id in this.players) {
			const player = this.players[id];
			if (this.chosenPokemon.has(player)) continue;
			const pokemon = keys[0];
			keys.shift();
			player.say("You did not select a Pokemon so you were randomly assigned " + pokemon + ".");
			this.chosenPokemon.set(player, pokemon);
		}

		const remainingPlayerCount = this.getRemainingPlayerCount();
		let fakeCount = Math.floor(remainingPlayerCount / 3);
		if (fakeCount < 1) fakeCount = 1;
		for (let i = 0; i < fakeCount; i++) {
			this.decoyPokemon.push(keys[0]);
			keys.shift();
		}

		this.criminalCount = Math.ceil(remainingPlayerCount / 3);
		this.detectiveCount = remainingPlayerCount - this.criminalCount;
		const players = this.shuffle(Object.keys(this.players));
		let count = 0;
		const criminalNames: string[] = [];
		for (let i = 0; i < players.length; i++) {
			const player = this.players[players[i]];
			if (player.eliminated) continue;
			if (count < this.criminalCount) {
				this.criminals.push(player);
				criminalNames.push(player.name + " (" + this.chosenPokemon.get(player) + ")");
				player.say("You have been assigned the role of criminal for this game!");
				count++;
			} else {
				this.detectives.push(player);
				player.say("You have been assigned the role of detective for this game!");
			}
		}
		for (let i = 0; i < this.criminals.length; i++) {
			this.criminals[i].say("Criminal list: " + criminalNames.join(", "));
		}

		this.say("Use Mismagius' hints each round to deduce who is a criminal and who is a detective!");
		this.nextRound();
	}

	onNextRound() {
		if (!this.getRemainingPlayerCount(this.criminals) || !this.getRemainingPlayerCount(this.detectives)) return this.end();
		let mons: string[] = [];
		this.chosenPokemon.forEach((species, player) => {
			if (player.eliminated) return;
			mons.push(species);
		});
		const roundCategories = this.shuffle(categories);
		if (this.lastCategory) roundCategories.splice(roundCategories.indexOf(this.lastCategory), 1);
		let category: Category;
		let param: string = '';
		while (!param && roundCategories.length) {
			category = roundCategories[0];
			roundCategories.shift();
			const keys = this.shuffle(dataKeys[category]);
			for (let i = 0; i < keys.length; i++) {
				if (this.previousParams.includes(keys[i])) continue;
				let matchingPokemon = 0;
				const list = data[category][keys[i]];
				for (let i = 0; i < mons.length; i++) {
					if (list.includes(mons[i])) matchingPokemon++;
				}
				if (matchingPokemon && matchingPokemon < mons.length) {
					param = keys[i];
					break;
				}
			}
		}
		if (!param) {
			this.say("Mismagius is out of hints!");
			return this.end();
		}

		this.previousParams.push(param);
		const players: string[] = [];
		for (const id in this.players) {
			if (this.players[id].eliminated) continue;
			const player = this.players[id];
			let text = player.name + ": ";
			const chosenPokemon = this.chosenPokemon.get(player)!;
			const hasParam = data[category!][param].includes(chosenPokemon);
			const isCriminal = this.criminals.includes(player);
			if ((hasParam && !isCriminal) || (!hasParam && isCriminal)) {
				text += "T";
			} else {
				text += "F";
			}
			players.push(text);
		}
		mons = mons.concat(this.decoyPokemon).sort();
		this.roundGuesses.clear();
		const html = "<center><b>Param " + this.round + "</b>: " + param + "<br><br><b>Pokemon</b>: " + mons.join(", ") + "<br><br><b>Players</b>: " + players.join(", ") + "</center>";
		this.onHtml(html, () => {
			this.timeout = setTimeout(() => this.nextRound(), 45 * 1000);
		});
		this.sayHtml(html);
	}

	onEnd() {
		const detectiveWin = this.criminalCount === 0;
		for (let i = 0; i < this.detectives.length; i++) {
			const player = this.detectives[i];
			const identifications = this.identifications.get(player);
			let bits = 0;
			if (detectiveWin) {
				bits = 300;
				if (identifications) bits += 100 * identifications;
				if (!player.eliminated) this.winners.set(player, 1);
			} else {
				if (identifications) bits += 50 * identifications;
			}
			if (bits) this.addBits(player, bits);
		}
		let remainingCriminals = 0;
		for (let i = 0; i < this.criminals.length; i++) {
			const player = this.criminals[i];
			const kidnaps = this.kidnaps.get(player);
			let bits = 0;
			if (!detectiveWin) {
				remainingCriminals++;
				bits = 300;
				if (kidnaps) bits += 150 * kidnaps;
				if (!player.eliminated) this.winners.set(player, 1);
			} else {
				if (kidnaps) bits += 75 * kidnaps;
			}
			this.addBits(player, bits);
		}
		const len = this.winners.size;
		if (len) {
			const names = this.getPlayerNames(this.winners);
			// if (!detectiveWin && remainingCriminals === 1) Games.unlockAchievement(this.room, names, "Criminal Mind", this);
			this.say("**Winner" + (len > 1 ? "s" : "") + "**: " + names);
		} else {
			this.say("No winners this game!");
		}
	}

	getPlayerSummary(player: Player) {
		if (!this.criminals.length) return player.say("The roles have not been distributed yet.");
		if (this.criminals.includes(player)) {
			const criminals: string[] = [];
			for (let i = 0; i < this.criminals.length; i++) {
				if (this.criminals[i].name !== player.name) criminals.push(this.criminals[i].name);
			}
			player.say("You are a criminal (" + this.chosenPokemon.get(player) + "). Your fellow criminals are " + Tools.joinList(criminals));
		} else {
			player.say("You " + (player.eliminated ? "were" : "are") + " a detective (" + this.chosenPokemon.get(player) + ").");
		}
	}
}

const commands: Dict<ICommandDefinition<MismagiusFoulPlay>> = {
	select: {
		command(target, room, user) {
			if (!this.started || !(user.id in this.players) || this.players[user.id].eliminated) return;
			const player = this.players[user.id];
			if (this.chosenPokemon.has(player)) return user.say("You already have an assigned Pokemon.");
			const pokemon = Dex.getPokemon(target);
			if (!pokemon) return user.say("You must specify a valid Pokemon.");
			if (!data.pokemon.includes(pokemon.species)) return user.say(pokemon.species + " cannot be used in this game.");
			let chosen = false;
			this.chosenPokemon.forEach((species, player) => {
				if (species === pokemon!.species) chosen = true;
			});
			if (chosen) return user.say(pokemon.species + " is already assigned to another player.");
			user.say("You have chosen " + pokemon.species + "!");
			this.chosenPokemon.set(player, pokemon.species);
		},
		pmOnly: true,
	},
	suspect: {
		command(target, room, user) {
			if (!this.started || !(user.id in this.players) || this.players[user.id].eliminated) return;
			const player = this.players[user.id];
			if (this.roundGuesses.has(player)) return player.say("You have already suspected a player this round!");

			const targets = target.split(",");
			if (targets.length !== 2) return player.say("You must specify the player and the Pokemon.");

			const targetId = Tools.toId(targets[0]);
			if (!(targetId in this.players)) return player.say("You must specify a player in the game.");
			if (this.players[targetId].eliminated) return player.say(this.players[targetId].name + " has already been eliminated.");

			const pokemon = Dex.getPokemon(targets[1]);
			if (!pokemon) return player.say("You must specify a valid Pokemon.");

			const targetPlayer = this.players[targetId];
			const playerCriminal = this.criminals.includes(player);
			const targetCriminal = this.criminals.includes(targetPlayer);
			if (playerCriminal && targetCriminal) return player.say("You can't suspect a fellow criminal!");
			this.roundGuesses.set(player, true);
			if ((playerCriminal || targetCriminal) && this.chosenPokemon.get(targetPlayer) === pokemon.species) {
				targetPlayer.eliminated = true;
				if (playerCriminal) {
					const kidnaps = this.kidnaps.get(player) || 0;
					this.kidnaps.set(player, kidnaps + 1);
				} else {
					const identifications = this.identifications.get(player) || 0;
					this.identifications.set(player, identifications + 1);
				}
				const action = playerCriminal ? "kidnapped" : "identified";
				player.say("You " + action + " " + targetPlayer.name + "!");
				targetPlayer.say("You were " + action + "!");
				if (targetCriminal) {
					this.criminalCount--;
					if (this.criminalCount === 0) {
						this.say("All criminals have been " + action + "!");
						this.end();
						return;
					}
				} else {
					this.detectiveCount--;
					if (this.detectiveCount === 0) {
						this.say("All detectives have been " + action + "!");
						this.end();
						return;
					}
				}
			} else {
				player.say("You failed to " + (playerCriminal ? "kidnap" : "identify") + " " + targetPlayer.name + ".");
			}
		},
		pmOnly: true,
	},
};
commands.summary = Tools.deepClone(Games.globalGameCommands.summary);
if (!commands.summary.aliases) commands.summary.aliases = [];
commands.summary.aliases.push('role');

export const game: IGameFile<MismagiusFoulPlay> = {
	aliases: ['mismagius', 'mfp'],
	battleFrontierCategory: 'Knowledge',
	class: MismagiusFoulPlay,
	commandDescriptions: [Config.commandCharacter + "select [Pokemon]", Config.commandCharacter + "suspect [player], [Pokemon]"],
	commands,
	description: "<a href='https://docs.google.com/document/d/1Zx72KwQjQyKE4yWsM83yimglxa5qOnM-YTudCJ89fKM/edit'>Guide</a> | Detectives try to help Mismagius identify the criminals in this murder mystery team game (one guess per round)! Parameters will be given as hints but they will be opposite for criminals.",
	name,
	mascot: "Mismagius",
	scriptedOnly: true,
};
