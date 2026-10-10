function createPokemonCard(pokemon) {
    const types = pokemon.types
        .map((type) => `<span class="pokemon-type">${type.type.name}</span>`)
        .join("");
    return `
        <li>
           <button class="pokemon-card type-${pokemon.types[0].type.name}" data-id="card" data-pokemon-id="${pokemon.id}" type="button" aria-label="Open ${pokemon.name} details">
                <img
                    data-id="card-image"
                    src="${pokemon.sprites.other["official-artwork"].front_default}"
                    alt="${pokemon.name}"
                >
                <span class="pokemon-name">${pokemon.name}</span>
                <span class="pokemon-types">${types}</span>
            </button>
        </li>
    `;
}