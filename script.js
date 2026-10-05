const API_URL = "https://pokeapi.co/api/v2/pokemon";
const POKEMON_LIMIT = 30;

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

    pokemonData = [...pokemonData, ...data.results];
    await renderPokemon(data.results);
    offset += POKEMON_LIMIT;
    isLoading = false;
    loadMoreButton.disabled = false;
}
async function renderPokemon(pokemonArray) {
    const pokemonDetails = await getPokemonDetails(pokemonArray);
    pokemonList.innerHTML += pokemonDetails
        .map(createPokemonCard)
        .join("");
}
async function getPokemonDetails(pokemonArray) {
    return Promise.all(
        pokemonArray.map(async (pokemon) => {
            const response = await fetch(pokemon.url);
            return response.json();
        })
    );
}

function createPokemonCard(pokemon) {
    const types = pokemon.types
        .map((type) => type.type.name)
        .join(" / ");
        return `
        <li>
            <button class="pokemon-card" data-id="card" type="button">
                <img
                    data-id="card-image"
                    src="${pokemon.sprites.front_default}"
                    alt="${pokemon.name}"
                >
                <span class="pokemon-name">${pokemon.name}</span>
                <span class="pokemon-type">${types}</span>
            </button>
        </li>
    `;
}

loadMoreButton.addEventListener("click", loadPokemon);
init();