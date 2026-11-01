import { clampDiff, habDiff, SITUATIONS } from '../engine/combat';
import { useBilly } from '../store/derived';
import type { Game } from '../store/store';
import { signed } from '../ui/format';
import { DieFaceSvg } from '../ui/Dice';
import type { DieFace } from '../engine/rolls';

const DIFFS = Array.from({ length: 15 }, (_, i) => i - 7);

export function Reference({ game }: { game: Game }) {
  const { book, base } = useBilly(game);
  const active = game.combat ? clampDiff(habDiff({ book, base }, game.combat)) : undefined;

  return (
    <>
      <h1 className="title">Table des situations</h1>
      <p className="small muted">
        Écart = votre habileté moins celle de l'adversaire. Chaque case : dommages que vous infligez – dommages que vous subissez.
        {active !== undefined && ` La colonne du combat en cours (${signed(active)}) est surlignée.`}
      </p>

      <div className="situation-table">
        <table>
          <thead>
            <tr>
              <th scope="row">Écart</th>
              {DIFFS.map(d => (
                <th key={d} className={d === active ? 'col-on' : undefined} title={SITUATIONS.find(s => d >= s.min && d <= s.max)?.label}>
                  {signed(d)}
                </th>
              ))}
            </tr>
            <tr>
              <th scope="row" className="small">
                Fuite
              </th>
              {DIFFS.map(d => (
                <td key={d} className={d === active ? 'col-on' : undefined}>
                  {book.fleeCost[d]}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map(die => (
              <tr key={die}>
                <th scope="row">
                  <DieFaceSvg face={die as DieFace} size={22} />
                </th>
                {DIFFS.map(d => {
                  const [b, a] = book.situationTable[d][die - 1];
                  return (
                    <td key={d} className={d === active ? 'col-on' : undefined}>
                      {b}–{a}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted">
        Écart de +8 ou plus : domination, victoire automatique. −8 ou moins : défaite automatique. La ligne « Fuite » donne le coût en
        chance pour fuir (Billy prudent).
      </p>

      <h2 className="heading">Rappel des règles</h2>
      <div>
        <Rule title="Un tour de combat">
          <ol style={{ paddingLeft: 20 }}>
            <li>Lancez le dé d'attaque et lisez la case de votre colonne.</li>
            <li>Ajoutez les dégâts de l'attaquant, retirez l'armure du défenseur.</li>
            <li>Si votre adresse est d'au moins 2, lancez l'esquive : sur votre adresse ou moins, vous ne subissez rien.</li>
            <li>
              Esquive sur un 1 : contre-attaque critique. Vous infligez le maximum de votre colonne (ligne du 6) plus votre critique, sans
              dégâts bonus et en ignorant l'armure.
            </li>
          </ol>
        </Rule>
        <Rule title="Mort mutuelle">
          <p>
            Si votre attaque tue l'adversaire, ses dégâts comptent quand même. Mais si vous mourriez tous les deux, ses dégâts sont annulés
            : vous l'achevez avant sa riposte.
          </p>
        </Rule>
        <Rule title="Jets d'adresse et de chance">
          <p>
            Adresse : réussi si le dé est inférieur ou égal à votre adresse (maximum 5). Chance : réussi si le dé est inférieur ou égal à
            votre chance actuelle, puis vous perdez 1 point, réussi ou non.
          </p>
        </Rule>
        {Object.values(book.characters).map(c => (
          <Rule key={c.label} title={`Billy ${c.label.toLowerCase()}`}>
            <p>{c.power}</p>
            {c.label === 'Prudent' && (
              <ul style={{ paddingLeft: 20 }}>
                <li>Fuite : jet de chance, coût selon la table. Ratée, vous ne perdez que 1 point et combattez normalement.</li>
                <li>Survie : quand un coup vous tue, jet de chance pour 1 point, puis 2, puis 3… dans le même combat.</li>
                <li>Coup chanceux : jet de chance pour 1 point. Réussi, vos dégâts finaux sont doublés ; raté, vous n'infligez rien.</li>
              </ul>
            )}
          </Rule>
        ))}
      </div>
    </>
  );
}

function Rule({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rule">
      <summary>{title}</summary>
      {children}
    </details>
  );
}
