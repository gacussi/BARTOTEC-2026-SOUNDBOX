<?php


function deezerRequisicao($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $resposta = curl_exec($ch);

    if ($resposta === false) {
        curl_close($ch);
        return null;
    }
    curl_close($ch);

    return json_decode($resposta, true);
}

// Busca geral (músicas, álbuns ou artistas)
function deezerBuscar($termo, $tipo = "track") {
    // tipos aceitos pelo Deezer: track, album, artist, playlist
    $tiposValidos = ["track", "album", "artist", "playlist"];
    if (!in_array($tipo, $tiposValidos)) {
        $tipo = "track";
    }

    $termo = urlencode($termo);
    $url = "https://api.deezer.com/search/$tipo?q=$termo";

    $dados = deezerRequisicao($url);
    return $dados["data"] ?? [];
}

// =========================================================
// MÚSICAS E ÁLBUNS (detalhes)
// =========================================================

// Detalhes de uma música específica
function deezerObterMusica($id) {
    $id = (int) $id;
    return deezerRequisicao("https://api.deezer.com/track/$id");
}

// Detalhes de um álbum específico (inclui a lista de faixas)
function deezerObterAlbum($id) {
    $id = (int) $id;
    return deezerRequisicao("https://api.deezer.com/album/$id");
}

// =========================================================
// ARTISTAS
// =========================================================

// Detalhes de um artista
function deezerObterArtista($id) {
    $id = (int) $id;
    return deezerRequisicao("https://api.deezer.com/artist/$id");
}

// Top músicas de um artista
function deezerTopMusicasArtista($id, $limite = 10) {
    $id = (int) $id;
    $limite = (int) $limite;
    $dados = deezerRequisicao("https://api.deezer.com/artist/$id/top?limit=$limite");
    return $dados["data"] ?? [];
}

// Álbuns de um artista
function deezerAlbunsArtista($id, $limite = 25) {
    $id = (int) $id;
    $limite = (int) $limite;
    $dados = deezerRequisicao("https://api.deezer.com/artist/$id/albums?limit=$limite");
    return $dados["data"] ?? [];
}

const DEEZER_PLAYLIST_TOP_MUNDIAL = 3155776842;

// Busca as faixas da playlist mundial (função interna, usada pelas 3 abaixo)
function deezerFaixasTopMundial($limite = 100) {
    $limite = max(1, min(100, (int) $limite));
    $dados = deezerRequisicao(
        "https://api.deezer.com/playlist/" . DEEZER_PLAYLIST_TOP_MUNDIAL . "/tracks?limit=$limite"
    );
    return $dados["data"] ?? [];
}

// Top músicas mundiais do momento
function deezerChartMusicas($limite = 25) {
    $limite = max(1, min(100, (int) $limite));
    return array_slice(deezerFaixasTopMundial(100), 0, $limite);
}

// Top álbuns mundiais = álbuns das músicas mais tocadas, sem repetir
function deezerChartAlbuns($limite = 25) {
    $limite = max(1, min(100, (int) $limite));
    $faixas = deezerFaixasTopMundial(100);

    $vistos = [];
    $albuns = [];
    foreach ($faixas as $faixa) {
        $album = $faixa["album"] ?? null;
        $id = $album["id"] ?? null;
        if (!$id || isset($vistos[$id])) {
            continue;
        }
        $vistos[$id] = true;
        $albuns[] = $album;
        if (count($albuns) >= $limite) {
            break;
        }
    }
    return $albuns;
}

// Top artistas mundiais = artistas mais presentes nas músicas mais tocadas
function deezerChartArtistas($limite = 25) {
    $limite = max(1, min(100, (int) $limite));
    $faixas = deezerFaixasTopMundial(100);

    $vistos = [];
    $artistas = [];
    foreach ($faixas as $faixa) {
        $artista = $faixa["artist"] ?? null;
        $id = $artista["id"] ?? null;
        if (!$id || isset($vistos[$id])) {
            continue;
        }
        $vistos[$id] = true;
        $artistas[] = $artista;
        if (count($artistas) >= $limite) {
            break;
        }
    }
    return $artistas;
}

// Lançamentos novos mundiais.
// O endpoint oficial de "editorial releases" do Deezer sofre do mesmo
// problema do chart/0 (localiza pelo IP do servidor), então NÃO usamos ele.
// Em vez disso, montamos a lista na mão: pegamos os artistas do Top Worldwide
// (mundial de verdade) e buscamos o álbum mais recente de cada um.
function deezerNovosLancamentos() {
    $artistas = deezerChartArtistas(50);
    $lancamentos = [];

    foreach ($artistas as $artista) {
        $idArtista = $artista["id"] ?? null;
        if (!$idArtista) {
            continue;
        }
        $albuns = deezerAlbunsArtista($idArtista, 3);
        foreach ($albuns as $album) {
            $lancamentos[] = $album;
        }
    }

    // remove duplicados (o mesmo álbum pode aparecer em mais de um artista,
    // por exemplo quando é uma feat. entre dois artistas do top 50)
    $vistos = [];
    $semDuplicados = [];
    foreach ($lancamentos as $item) {
        $id = $item["id"] ?? null;
        if ($id === null || isset($vistos[$id])) {
            continue;
        }
        $vistos[$id] = true;
        $semDuplicados[] = $item;
    }
    $lancamentos = $semDuplicados;

    // ordena do lançamento mais novo pro mais velho
    usort($lancamentos, function ($a, $b) {
        return strcmp($b["release_date"] ?? "", $a["release_date"] ?? "");
    });

    return $lancamentos;
}

// Top playlists em destaque (esse endpoint do Deezer não tem um equivalente
// "mundial" fixo como os de cima; mantido como está, útil só como extra)
function deezerChartPlaylists($limite = 25) {
    $limite = (int) $limite;
    $dados = deezerRequisicao("https://api.deezer.com/chart/0/playlists?limit=$limite");
    return $dados["data"] ?? [];
}

// =========================================================
// GÊNEROS E PLAYLISTS
// =========================================================

// Lista todos os gêneros musicais disponíveis (útil pra montar filtros)
function deezerGeneros() {
    $dados = deezerRequisicao("https://api.deezer.com/genre");
    return $dados["data"] ?? [];
}

// Detalhes de um gênero específico
function deezerObterGenero($id) {
    $id = (int) $id;
    return deezerRequisicao("https://api.deezer.com/genre/$id");
}

// Detalhes de uma playlist pública (com as faixas)
function deezerObterPlaylist($id) {
    $id = (int) $id;
    return deezerRequisicao("https://api.deezer.com/playlist/$id");
}