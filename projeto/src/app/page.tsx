/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, Plus, CalculatorIcon } from "lucide-react"

interface Aresta {
  origem: string
  destino: string
  peso: number
}

export default function Home() {
  const [pontos, setPontos] = useState<string[]>([])
  const [novoPonto, setNovoPonto] = useState("")
  const [arestas, setArestas] = useState<Aresta[]>([])
  const [pontoOrigem, setPontoOrigem] = useState("")
  const [pontoDestino, setPontoDestino] = useState("")
  const [distancia, setDistancia] = useState("")
  const [resultado, setResultado] = useState<{
    rota: Aresta[]
    custoTotal: number
    caminho?: string[]
  } | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const adicionarPonto = () => {
    if (!novoPonto.trim()) {
      setErro("Nome do ponto não pode estar vazio")
      return
    }

    if (pontos.includes(novoPonto.trim())) {
      setErro("Ponto já existe")
      return
    }

    setPontos([...pontos, novoPonto.trim()])
    setNovoPonto("")
    setErro(null)
  }

  const removerPonto = (ponto: string) => {
    setPontos(pontos.filter((p) => p !== ponto))
    setArestas(arestas.filter((a) => a.origem !== ponto && a.destino !== ponto))
  }

  const adicionarAresta = () => {
    if (!pontoOrigem || !pontoDestino || !distancia) {
      setErro("Por favor, selecione ambos os pontos e insira uma distância")
      return
    }

    if (pontoOrigem === pontoDestino) {
      setErro("Não é possível adicionar distância de um ponto para ele mesmo")
      return
    }

    const peso = Number.parseFloat(distancia)
    if (isNaN(peso) || peso <= 0) {
      setErro("A distância deve ser um número positivo")
      return
    }

    // Verifica se esta aresta já existe
    const arestaExiste = arestas.some(
      (a) =>
        (a.origem === pontoOrigem && a.destino === pontoDestino) ||
        (a.origem === pontoDestino && a.destino === pontoOrigem),
    )

    if (arestaExiste) {
      setErro("Esta conexão já existe")
      return
    }

    setArestas([...arestas, { origem: pontoOrigem, destino: pontoDestino, peso }])
    setPontoOrigem("")
    setPontoDestino("")
    setDistancia("")
    setErro(null)
  }

  const removerAresta = (indice: number) => {
    setArestas(arestas.filter((_, i) => i !== indice))
  }

  const calcularRota = () => {
    if (pontos.length < 2) {
      setErro("É necessário pelo menos 2 pontos para calcular uma rota")
      return
    }

    // matriz de adjacência para acesso mais fácil às distâncias
    const grafo: Record<string, Record<string, number>> = {}

    // Inicializa o grafo
    pontos.forEach((ponto) => {
      grafo[ponto] = {}
      pontos.forEach((p) => {
        if (p !== ponto) {
          grafo[ponto][p] = Number.POSITIVE_INFINITY
        }
      })
    })

    // Preenche as distâncias conhecidas
    arestas.forEach((aresta) => {
      grafo[aresta.origem][aresta.destino] = aresta.peso
      grafo[aresta.destino][aresta.origem] = aresta.peso // Grafo não direcionado
    })

    // Verifica se o grafo está conectado o suficiente para formar um caminho
    let estaConectado = true
    pontos.forEach((ponto) => {
      let temConexao = false
      pontos.forEach((p) => {
        if (p !== ponto && grafo[ponto][p] !== Number.POSITIVE_INFINITY) {
          temConexao = true
        }
      })
      if (!temConexao && pontos.length > 1) {
        estaConectado = false
      }
    })

    if (!estaConectado) {
      setErro("O grafo não está conectado o suficiente para formar um caminho")
      return
    }

    // Algoritmo do vizinho mais próximo para encontrar um caminho linear
    const pontoInicial = pontos[0] // Começa pelo primeiro ponto
    const caminho: string[] = [pontoInicial]
    const visitados: Record<string, boolean> = { [pontoInicial]: true }

    while (caminho.length < pontos.length) {
      const atual = caminho[caminho.length - 1]
      let maisProximo = null
      let distanciaMinima = Number.POSITIVE_INFINITY

      // Encontra o vizinho não visitado mais próximo
      pontos.forEach((ponto) => {
        if (!visitados[ponto] && grafo[atual][ponto] < distanciaMinima) {
          maisProximo = ponto
          distanciaMinima = grafo[atual][ponto]
        }
      })

      if (maisProximo === null) {
        setErro("Não é possível formar um caminho completo com as conexões fornecidas")
        return
      }

      caminho.push(maisProximo)
      visitados[maisProximo] = true
    }

    // Converte o caminho em arestas
    const arestasRota: Aresta[] = []
    let custoTotal = 0

    for (let i = 0; i < caminho.length - 1; i++) {
      const origem = caminho[i]
      const destino = caminho[i + 1]
      const peso = grafo[origem][destino]
      arestasRota.push({ origem, destino, peso })
      custoTotal += peso
    }

    setResultado({
      rota: arestasRota,
      custoTotal,
      caminho,
    })

    setErro(null)
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Otimizador de Rotas - Melhor Rota Linear</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Pontos de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Nome do ponto (ex: A, B, C)"
                value={novoPonto}
                onChange={(e: any) => setNovoPonto(e.target.value)}
                onKeyDown={(e: any) => e.key === "Enter" && adicionarPonto()}
              />
              <Button onClick={adicionarPonto}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {pontos.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-4">
                {pontos.map((ponto) => (
                  <div
                    key={ponto}
                    className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
                  >
                    {ponto}
                    <Button variant="ghost" size="sm" className="h-4 w-4 ml-2 p-0" onClick={() => removerPonto(ponto)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum ponto adicionado ainda</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distâncias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="origem">De</Label>
                <select
                  id="origem"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={pontoOrigem}
                  onChange={(e) => setPontoOrigem(e.target.value)}
                >
                  <option value="">Selecione o ponto</option>
                  {pontos.map((ponto) => (
                    <option key={ponto} value={ponto}>
                      {ponto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="destino">Para</Label>
                <select
                  id="destino"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={pontoDestino}
                  onChange={(e) => setPontoDestino(e.target.value)}
                >
                  <option value="">Selecione o ponto</option>
                  {pontos.map((ponto) => (
                    <option key={ponto} value={ponto}>
                      {ponto}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <Label htmlFor="distancia">Distância</Label>
                <Input
                  id="distancia"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="Distância"
                  value={distancia}
                  onChange={(e: any) => setDistancia(e.target.value)}
                  onKeyDown={(e: any) => e.key === "Enter" && adicionarAresta()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={adicionarAresta}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {arestas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>De</TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead>Distância</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arestas.map((aresta, indice) => (
                    <TableRow key={indice}>
                      <TableCell>{aresta.origem}</TableCell>
                      <TableCell>{aresta.destino}</TableCell>
                      <TableCell>{aresta.peso}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removerAresta(indice)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma distância adicionada ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {erro && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center mt-8">
        <Button size="lg" onClick={calcularRota}>
          <CalculatorIcon className="h-5 w-5 mr-2" />
          Calcular Melhor Rota
        </Button>
      </div>

      {resultado && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resultado da Rota Ótima</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Caminho Linear:</h3>
                <p className="text-xl mt-2">{resultado.caminho?.join(" → ")}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium">Custo Total:</h3>
                <p className="text-2xl font-bold">{resultado.custoTotal}</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>De</TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead>Distância</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.rota.map((aresta, indice) => (
                    <TableRow key={indice}>
                      <TableCell>{aresta.origem}</TableCell>
                      <TableCell>{aresta.destino}</TableCell>
                      <TableCell>{aresta.peso}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">
                      Total
                    </TableCell>
                    <TableCell className="font-bold">{resultado.custoTotal}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}