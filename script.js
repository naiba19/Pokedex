const API_URL = "https://pokeapi.co/api/v2/pokemon";
const SPECIES_API_URL = "https://pokeapi.co/api/v2/pokemon-species";
const POKEMON_LIMIT = 20;

let offset = 0;
let pokemonDetailsData = [];
let displayedPokemonData = [];
let pokemonCache = {};
let evolutionCache = {};
let isLoading = false;

const pokemonList = document.querySelector(".pokemon-list");
const loadMoreButton = document.querySelector('[data-id="load-more-button"]');
const dialog = document.querySelector('[data-id="dialog"]');
const pokemonCards = document.querySelector(".pokemon-list");
const searchForm = document.querySelector(".search-form");
const searchInput = document.querySelector('[data-id="search-input"]');
const notFound = document.querySelector('[data-id="not-found"]');
const loading = document.querySelector('[data-id="loading"]');

async function init() {
    await loadPokemon();
}

function setLoadingState(loadingState) {
    loading.hidden = !loadingState;
    loadMoreButton.disabled = loadingState;
}

async function fetchPokemonData() {
    const response = await fetch(
        `${API_URL}?limit=${POKEMON_LIMIT}&offset=${offset}`
    );

    return response.json();
}

async function loadPokemon() {
    if (isLoading) return;
    isLoading = true;
    setLoadingState(true);

    try {
        const data = await fetchPokemonData();

        await renderPokemon(data.results);
        offset += POKEMON_LIMIT;
    } catch (error) {
        console.error("Failed to load Pokémon:", error);
        alert("Could not load Pokémon. Please try again.");
    } finally {
        setLoadingState(false);
        isLoading = false;
    }
}

async function renderPokemon(pokemonArray) {
    const pokemonDetails = await getPokemonDetails(pokemonArray);
    pokemonDetailsData = [...pokemonDetailsData, ...pokemonDetails];
    displayedPokemonData = [...pokemonDetailsData];

    renderPokemonCards(pokemonDetails);
}

async function getPokemonDetails(pokemonArray) {
    return Promise.all(
        pokemonArray.map(async (pokemon) => {
            if (pokemonCache[pokemon.name]) {
                return pokemonCache[pokemon.name];
            }

            const response = await fetch(pokemon.url);
            const data = await response.json();
            pokemonCache[pokemon.name] = data;
            return data;

        })
    );
}

async function searchPokemon() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm.length < 3) {
        displayedPokemonData = [...pokemonDetailsData];

        pokemonList.innerHTML = pokemonDetailsData
            .map(createPokemonCard)
            .join("");
            
        notFound.hidden = true;
        return;
    }

    const pokemon = pokemonDetailsData.filter((pokemon) =>
        pokemon.name.includes(searchTerm)
    );

    displayedPokemonData = pokemon;
    pokemonList.innerHTML = pokemon.map(createPokemonCard).join("");
    notFound.hidden = pokemon.length !== 0;
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchPokemon();
});

function createPokemonCard(pokemon) {
    const types = pokemon.types
        .map((type) => type.type.name)
        .join(" / ");
    return `
        <li>
           <button class="pokemon-card type-${pokemon.types[0].type.name}" data-id="card" data-pokemon-id="${pokemon.id}" type="button" aria-label="Open ${pokemon.name} details">
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

function renderPokemonCards(pokemonDetails) {
    pokemonList.innerHTML += pokemonDetails
        .map(createPokemonCard)
        .join("");
}

loadMoreButton.addEventListener("click", loadPokemon);

async function loadEvolutionChain(pokemon) {
    if (evolutionCache[pokemon.id]) {
        return evolutionCache[pokemon.id];
    }

    const speciesResponse = await fetch(
        `${SPECIES_API_URL}/${pokemon.id}`
    );

    const speciesData = await speciesResponse.json();
    const evolutionUrl = speciesData.evolution_chain.url;

    const evolutionResponse = await fetch(evolutionUrl);
    const evolutionData = await evolutionResponse.json();

    evolutionCache[pokemon.id] = evolutionData;
    return evolutionData;
}

function getEvolutionNames(chain) {
    const names = [chain.species.name];

    chain.evolves_to.forEach((evolution) => {
        names.push(...getEvolutionNames(evolution));
    });
    return names;
}



async function openPokemonDialog(pokemon) {
    const dialogName = document.querySelector(".dialog-name");
    const dialogImage = document.querySelector('[data-id="dialog-image"]');
    const hp = document.querySelector(".stat-hp");
    const attack = document.querySelector(".stat-attack");
    const defense = document.querySelector(".stat-defense");

    dialogName.textContent = pokemon.name;
    const loadEvolutionData = await loadEvolutionChain(pokemon);
    const evolutionNames = getEvolutionNames(loadEvolutionData.chain);
    document.querySelector('[data-id="evolution-chain"]').textContent =
        `Evolution: ${evolutionNames.join(" → ")}`;
    dialogImage.src = pokemon.sprites.front_default;
    dialogImage.alt = pokemon.name;
    dialogImage.dataset.pokemonId = pokemon.id;

    hp.textContent = pokemon.stats[0].base_stat;
    attack.textContent = pokemon.stats[1].base_stat;
    defense.textContent = pokemon.stats[2].base_stat;

    dialog.showModal();
    document.body.style.overflow = "hidden";
}

pokemonCards.addEventListener("click", (event) => {
    const card = event.target.closest('[data-id="card"]');

    if (!card) return;
    const pokemonId = Number(card.dataset.pokemonId);
    const pokemon = pokemonDetailsData.find(
        (pokemon) => pokemon.id === pokemonId
    );

    if (!pokemon) return;

    openPokemonDialog(pokemon);
});

function showNextPokemon() {
    const currentId = Number(
        document.querySelector('[data-id="dialog-image"]').dataset.pokemonId
    );

    const currentIndex = displayedPokemonData.findIndex(
        (pokemon) => pokemon.id === currentId
    );

    const nextPokemon = displayedPokemonData[currentIndex + 1];

    if (nextPokemon) {
        openPokemonDialog(nextPokemon);
    }
}

function showPreviousPokemon() {
    const currentId = Number(
        document.querySelector('[data-id="dialog-image"]').dataset.pokemonId
    );

    const currentIndex = displayedPokemonData.findIndex(
        (pokemon) => pokemon.id === currentId
    );
    const previousPokemon = displayedPokemonData[currentIndex - 1];

    if (previousPokemon) {
        openPokemonDialog(previousPokemon);
    }
}

document.querySelector('[data-id="next-button"]')
    .addEventListener("click", showNextPokemon);

document.querySelector('[data-id="prev-button"]')
    .addEventListener("click", showPreviousPokemon);


document.querySelector('[data-id="close-dialog-button"]')
    .addEventListener("click", () => {
        dialog.close();
        document.body.style.overflow = "";
    });

dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
        dialog.close();
        document.body.style.overflow = "";
    }
});

init();