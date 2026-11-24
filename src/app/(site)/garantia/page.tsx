import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Garantia", alternates: { canonical: "/garantia" } };

export default function WarrantyPage() {
  return (
    <TextPage crumb="Garantia" title="Garantia" updated="novembro de 2026">
      <p>
        Os produtos vendidos pela Simumed têm garantia contra defeitos de fabricação pelo prazo informado na página de cada produto
        (em geral, 12 meses a partir da entrega), já incluída a garantia legal prevista no Código de Defesa do Consumidor.
      </p>
      <h2>O que a garantia não cobre</h2>
      <ul>
        <li>Desgaste natural de peças de uso contínuo, como peles, veias, traqueias e demais itens de reposição.</li>
        <li>Danos por uso fora das instruções do fabricante, quedas, umidade, produtos químicos ou limpeza inadequada.</li>
        <li>Equipamentos abertos ou consertados por terceiros não autorizados.</li>
        <li>Lâmpadas, pilhas e baterias, salvo defeito constatado na entrega.</li>
      </ul>
      <h2>Como acionar</h2>
      <p>
        <Link href="/manutencao">Abra uma solicitação de manutenção</Link> informando o número do pedido e descrevendo o problema, de
        preferência com fotos ou vídeo. Avaliamos e orientamos o envio ou o atendimento.
      </p>
    </TextPage>
  );
}
