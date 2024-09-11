import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';

interface CountryData {
    Country_name: string;
    Population: number;
    Continent: string;
    Flags: string;
}

interface PopulationData {
    [year: string]: CountryData[];
}

export async function GET() {
    await connectToDatabase();

    try {
        const db = await connectToDatabase();
        const data = await db.collection('population').findOne({});

        if (!data) {
            console.log('No data found in the collection');
            return NextResponse.json({});
        }


        // Remove _id field if present
        const { _id: _ignore, ...formattedData } = data as PopulationData;

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
