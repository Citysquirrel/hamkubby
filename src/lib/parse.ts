import type { Song } from "../config/types";

type CellValue = string | number | null;

const columns = ["", "_1", "_2", "_3", "_4", "_5", "_6"] as const;
type Column = (typeof columns)[number] | (string & {});

type SongRow = Partial<Record<Column, CellValue>>;

const genres = ["jpop", "kpop", "pop", "mission", "hiddenRows"] as const;
type Genre = (typeof genres)[number] | (string & {});

type SheetData = Partial<Record<Genre, SongRow[]>>;

type HiddenRow = Partial<Record<Genre, string>>;

export function parseList(csv: SheetData, startIdx: number): Song[] {
	const COLUMN = {
		ARTIST: "_3",
		TITLE: "_4",
		NOTE: "_5",
		CHEESE: "_6",
	} as const;
	const hiddenRows = String(csv.hiddenRows || "").split(";");
	const hiddenRow: HiddenRow = { jpop: hiddenRows[0], kpop: hiddenRows[1], pop: hiddenRows[2] };

	delete csv.hiddenRows;

	return Object.entries(csv).flatMap(([key, rows]) => {
		if (key === "mission") {
			// 미션인 경우에 대한 별도 지침 필요
		}
		const hiddenIdxs = String(hiddenRow[key] || "")
			.split(",")
			.map(Number);
		console.log(hiddenIdxs);

		if (!rows) return [];

		return rows.slice(startIdx).reduce<Song[]>((acc, row, index) => {
			if (hiddenIdxs.includes(index + 6)) return acc;
			const artist = row[COLUMN.ARTIST];
			const title = row[COLUMN.TITLE];
			const notes = row[COLUMN.NOTE];
			const cheese = row[COLUMN.CHEESE];

			if (!artist || !title) {
				return acc;
			}

			acc.push({
				id: `${key}-${index}`,
				genre: key,

				artist: String(artist),
				title: String(title),

				notes: notes ? String(notes) : "",
				cheese: cheese ? String(cheese) : "",
			});

			return acc;
		}, []);
	});
}
