"use client"

import BarChartRace from './components/BarChartRace';
import { useEffect, useState } from 'react';
import { YearData } from './types/data.types';
import '../app/globals.css';


const HomePage = () => {
  type PopulationData = {
    [key: string]: Array<{
      Country_name: string;
      Population: number;
      Continent: string;
      Flags: string;
    }>;
  };

  const [csvData, setCsvData] = useState<YearData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    
     

    const fetchData = async () => {
      
      
      try {

        const response = await fetch('/api/population');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data: PopulationData = await response.json();
        setCsvData(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message); 
        } else {
          setError("Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 className='title'>Population growth per country, 1950 to 2021</h1>
      <BarChartRace data={csvData} />
    </div>
  );
};


export default HomePage;
