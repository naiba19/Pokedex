const API_URL = "https://pokeapi.co/api/v2/pokemon";
const POKEMON_LIMIT = 24;

let offset = 0;
let pokemonData = [];
let isLoading = false;

const pokemonList = document.querySelector(".pokemon-list");
const loadMoreButton = document.querySelector('[data-id="load-more-button"]');

async function init() {
await loadPokemon();    
}

async function loadPokemon() {
    if (isLoading) return;
    isLoading = true;
    loadMoreButton.disabled = true;

    const response = await fetch(
        `${API_URL}?limit=${POKEMON_LIMIT}&offset=${offset}`
    );

    const data = await response.json();

    pokemonData = data.results;
    offset += POKEMON_LIMIT;
    console.log(pokemonData);
    isLoading = false;
    loadMoreButton.disabled = false;
}
init();