export type CountryData = {
    Country_name: string;
    Population: number;
    Continent: string;
    Flags:string
};

export type YearData = Record<string, CountryData[]>;

export interface BarChartRaceProps {
    data: YearData;
}