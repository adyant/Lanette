export interface IMonthlyTournamentSchedule {
	formats: Dict<string>;
	times: [number, number][];
}

export interface IRoomTournamentSchedule {
	months: Dict<IMonthlyTournamentSchedule>;
}

/**
 * Hours are in the same timezone as wherever Lanette is running
 */
export const tournamentSchedules: Dict<IRoomTournamentSchedule> = {
	'tournaments': {
		months: {
			'2': {
				formats: {
					'1': 'randombattle',
					'2': 'pu',
					'3': 'ou',
					'4': 'lc',
					'5': 'ubers',
					'6': 'nu',
					'7': 'doublesou',
					'8': 'uu',
					'9': 'ru',
					'10': 'balancedhackmons',
					'11': 'randombattle',
					'12': 'pu',
					'13': 'ou',
					'14': 'lc',
					'15': 'ubers',
					'16': 'nu',
					'17': 'doublesou',
					'18': 'uu',
					'19': 'ru',
					'20': 'stabmons',
					'21': 'randombattle',
					'22': 'pu',
					'23': 'ou',
					'24': 'lc',
					'25': 'ubers',
					'26': 'nu',
					'27': 'doublesou',
					'28': 'uu',
					'29': 'omotm',
				},
				times: [[20, 30], [2, 30], [9, 30], [15, 30]],
			},
		},
	},
	'toursplaza': {
		months: {
			'2': {
				formats: {
					'1': 'Gen7 PU, +PUBL',
					'2': 'NFE',
					'3': 'MixandMega, -Eternatus, -OU, -UU, -NFE',
					'4': 'UU',
					'5': 'Gen7 NU, -Incineroar, -Passimian',
					'6': 'Doubles OU, Dynamax Clause',
					'7': 'Gen7 Ubers, !obtainable abilities, -Comatose, -Contrary, -Fluffy, -Fur Coat, -Huge Power, -Illusion, -Imposter, -Innards Out, -Parental Bond, -Protean, -Pure Power, -Simple, -Stakeout, -Speed Boost, -Water Bubble, -Wonder Guard',
					'8': 'Gen4 Random Battle, Inverse Mod',
					'9': 'Mix and Mega',
					'10': 'Gen4 OU',
					'11': 'Almost Any Ability, Gen8 Camomons',
					'12': 'Gen7 RU, Gen7 Stabmons, -Aerodactyl, -Silvally, -Komala, -Acupressure, -Belly Drum, -Chatter, -Extreme Speed, -Geomancy, -Lovely Kiss, -Shell Smash, -Shift Gear, -Spore, -Tail Glow, -Thousand Arrows',
					'13': '[Let’s Go] OU',
					'14': 'Gen7 OU',
					'15': 'Gen7 Super Staff Bros Brawl',
					'16': 'Balanced Hackmons',
					'17': 'Ubers',
					'18': 'Gen7 ZU',
					'19': 'Gen7 LC, Item Clause',
					'20': 'Gen8 Monotype',
					'21': 'Gen7 NU, Same Type Clause',
					'22': 'omotm',
					'23': 'National Dex, !obtainable abilities, -Dracovish, -Shedinja, -Baton Pass, -Arena Trap, -Comatose, -Contrary, -Fluffy, -Fur Coat, -Gorilla Tactics, -Huge Power, -Ice Scales, -Illusion, -Imposter, -Innards Out, -Intrepid Sword, -Moody, -Neutralizing Gas, -Parental Bond, -Protean, -Pure Power, -Shadow Tag, -Simple, -Stakeout, -Speed Boost, -Water Bubble, -Wonder Guard',
					'24': 'Gen7 Battle Factory',
					'25': 'OU, -Corviknight',
					'26': 'Gen7 VGC 2017',
					'27': 'CAP',
					'28': 'LC, +gothita, +swirlix, +gastly, +cherubi',
					'29': 'omotm2',
				},
				times: [[5, 30], [12, 30], [18, 30], [23, 30]],
			},
		},
	},
};
