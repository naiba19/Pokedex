const API_URL = "https://pokeapi.co/api/v2/pokemon";
const SPECIES_API_URL = "https://pokeapi.co/api/v2/pokemon-species";
const POKEMON_LIMIT = 20;

let offset = 0;
let pokemonDetailsData = [];
let displayedPokemonData = [];
let pokemonCache = {};
let evolutionCache = {};
let isLoading = false;
let isSearchActive = false;

const pokemonList = document.querySelector(".pokemon-list");
const loadMoreButton = document.querySelector('[data-id="load-more-button"]');
const dialog = document.querySelector('[data-id="dialog"]');
const pokemonCards = document.querySelector(".pokemon-list");
const searchForm = document.querySelector(".search-form");
const searchInput = document.querySelector('[data-id="search-input"]');
const notFound = document.querySelector('[data-id="not-found"]');
const loading = document.querySelector('[data-id="loading"]');

async function init() {
    setEventListener();
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
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLoadingState(false);
        isLoading = false;
    }
}

async function renderPokemon(pokemonArray) {
    const pokemonDetails = await getPokemonDetails(pokemonArray);
    pokemonDetailsData = [...pokemonDetailsData, ...pokemonDetails];
    if (searchInput.value.trim().length < 3) {
        displayedPokemonData = [...pokemonDetailsData];
    }

    if (searchInput.value.trim().length >= 3) {
        searchPokemon();
    } else {
        renderPokemonCards(pokemonDetails);
    }
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

function searchPokemon() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm.length < 3) {
        resetPokemonSearch();
        return;
    }

    isSearchActive = true;

    const filteredPokemon = filterPokemonByName(searchTerm);

    displaySearchResults(filteredPokemon);
}

function resetPokemonSearch() {
    isSearchActive = false;
    displayedPokemonData = [...pokemonDetailsData];

    renderAllPokemonCards();
    loadMoreButton.textContent = "Load More";
    notFound.hidden = true;
}

function filterPokemonByName(searchTerm) {
    return pokemonDetailsData.filter((pokemon) =>
        pokemon.name.includes(searchTerm)
    );
}

function displaySearchResults(pokemon) {
    displayedPokemonData = pokemon;

    pokemonList.innerHTML = pokemon.map(createPokemonCard).join("");
    notFound.hidden = pokemon.length !== 0;
    loadMoreButton.textContent = "Back";
}

function renderAllPokemonCards() {
    pokemonList.innerHTML = pokemonDetailsData.map(createPokemonCard).join("");
}

function renderPokemonCards(pokemonDetails) {
    pokemonList.innerHTML += pokemonDetails.map(createPokemonCard).join("");
}

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

function updateNavigationButtons(currentIndex) {
    document.querySelector('[data-id="prev-button"]').disabled =
        currentIndex <= 0;

    document.querySelector('[data-id="next-button"]').disabled =
        currentIndex >= displayedPokemonData.length - 1;
}

async function openPokemonDialog(pokemon) {
    displayPokemonDetails(pokemon);
    await displayPokemonEvolution(pokemon);
    updatePokemonDialogNavigation(pokemon);
    showPokemonDialog();
}

function displayPokemonDetails(pokemon) {
    const dialogName = document.querySelector(".dialog-name");
    const dialogImage = document.querySelector('[data-id="dialog-image"]');

    dialogName.textContent = pokemon.name;
    dialogImage.src = pokemon.sprites.front_default;
    dialogImage.alt = pokemon.name;
    dialogImage.dataset.pokemonId = pokemon.id;

    displayPokemonStats(pokemon);
}

function displayPokemonStats(pokemon) {
    document.querySelector(".stat-hp").textContent =
        pokemon.stats[0].base_stat;

    document.querySelector(".stat-attack").textContent =
        pokemon.stats[1].base_stat;

    document.querySelector(".stat-defense").textContent =
        pokemon.stats[2].base_stat;
}

async function displayPokemonEvolution(pokemon) {
    const evolutionData = await loadEvolutionChain(pokemon);
    const evolutionNames = getEvolutionNames(evolutionData.chain);
    const formattedEvolutionNames = evolutionNames.map(
        (name) => capitalizePokemonName(name)
    );

    document.querySelector('[data-id="evolution-chain"]').textContent =
        `Evolution: ${formattedEvolutionNames.join(" → ")}`;
}

function capitalizePokemonName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function updatePokemonDialogNavigation(pokemon) {
    const currentIndex = displayedPokemonData.findIndex(
        (item) => item.id === pokemon.id
    );

    updateNavigationButtons(currentIndex);
}

function showPokemonDialog() {
    if (!dialog.open) {
        dialog.showModal();
    }

    document.body.style.overflow = "hidden";
}

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

function setEventListener() {
    setSearchEventListeners();
    setLoadMoreEventListeners();
    setPokemonCardEventListeners();
    setNavigationEventListeners();
    setDialogEventListeners();
}

function setSearchEventListeners() {
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        searchPokemon();
    });
}

function setLoadMoreEventListeners() {
    loadMoreButton.addEventListener("click", () => {
        if (isSearchActive) {
            searchInput.value = "";
            searchPokemon();
            return;
        }

        loadPokemon();
    });
}

function setPokemonCardEventListeners() {
    pokemonCards.addEventListener("click", (event) => {
        const card = event.target.closest('[data-id="card"]');

        if (!card) return;

        const pokemonId = Number(card.dataset.pokemonId);
        const pokemon = pokemonDetailsData.find(
            (item) => item.id === pokemonId
        );

        if (pokemon) openPokemonDialog(pokemon);
    });
}

function setNavigationEventListeners() {
    document.querySelector('[data-id="next-button"]')
        .addEventListener("click", showNextPokemon);

    document.querySelector('[data-id="prev-button"]')
        .addEventListener("click", showPreviousPokemon);

    document.addEventListener("keydown", handleDialogKeyboardNavigation);
}

function handleDialogKeyboardNavigation(event) {
    if (!dialog.open) return;

    if (event.key === "ArrowRight") showNextPokemon();
    if (event.key === "ArrowLeft") showPreviousPokemon();
}

function setDialogEventListeners() {
    document.querySelector('[data-id="close-dialog-button"]')
        .addEventListener("click", closePokemonDialog);

    dialog.addEventListener("click", handleDialogBackdropClick);
    dialog.addEventListener("close", resetBodyScroll);
}

function handleDialogBackdropClick(event) {
    if (event.target === dialog) {
        dialog.close();
    }
}

function closePokemonDialog() {
    dialog.close();
}

function resetBodyScroll() {
    document.body.style.overflow = "";
}

init();