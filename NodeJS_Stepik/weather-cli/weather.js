#!/usr/bin/env node
import { getArgs } from './helpers/args.js';
import { getIcon, getWeather } from './services/api.service.js';
import { printError, printHelp, printSuccess, printResult } from './services/log.service.js';
import { saveKeyValue, getKeyValue, TOKEN_DICTIONARY } from './services/storage.service.js';

const saveToken = async (token) => {
    if (!token.length) {
        return printError('No token provided');
    }
    try {
        await saveKeyValue(TOKEN_DICTIONARY.token, token);
        printSuccess('Token saved');
    }
    catch(err) {
        if (err) printError(err.message);
    }
}

const saveCity = async (city) => {
    if (!city.length) {
        return printError('No city provided');
    }
    try{
        await saveKeyValue(TOKEN_DICTIONARY.city, city);
        printSuccess('City saved');
    }
    catch(err) {
        if (err) printError(err.message);
    }
}

const getForcast = async () => {
    try {
        const city = process.env.CITY ?? await getKeyValue(TOKEN_DICTIONARY.city);
        const weather = await getWeather(city);
        printResult(weather, getIcon(weather.weather[0].icon));
    }
    catch(err) {
        if (err?.response?.status == 404) {
            printError('City incorrect');
        }
        else if (err?.response?.status == 401) {
            printError('Token incorrect');
        }
        else {
            printError(err.message);
        }
    }
}

const initCLI = () => {
    const args = getArgs(process.argv);
    
    if (args.h) {
        return printHelp();
    }
    if (args.s) {
        return saveCity(args.s);
    }
    if (args.t) {
        return saveToken(args.t);
    }
    return getForcast();
};

initCLI();