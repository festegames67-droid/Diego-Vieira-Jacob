import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import {
  BOTTLE_SPECS,
  EDITIONS,
  EDITION_ORDER,
  EditionId,
} from './data/editions';
import { BubiViceBottle3D } from './components/BubiViceBottle3D';
import { initHeroCanvas } from './webgl/heroCanvas';
import { initSpecsCanvas } from './webgl/specsCanvas';

type CordStyle = 'Combinado Vice' | 'Preto Stealth';

interface BagItem {
  editionId: EditionId;
  cord: CordStyle;
  price: number;
  qty: number;
}

function ProductImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div className={`img-fallback-box ${className ?? ''}`}>
        <Sparkles size={24} aria-hidden="true" />
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export default function App() {
  const [selectedEdition, setSelectedEdition] = useState<EditionId>('sunset');
  const [cordStyle, setCordStyle] = useState<CordStyle>('Combinado Vice');
  const [bag, setBag] = useState<BagItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderConfirmedCode, setOrderConfirmedCode] = useState<string | null>(
    null
  );

  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cleanupHero = initHeroCanvas(heroCanvasRef.current);
    const cleanupSpecs = initSpecsCanvas(specsCanvasRef.current);
    return () => {
      cleanupHero();
      cleanupSpecs();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const activeEditionData = EDITIONS[selectedEdition];

  const addToBag = (editionId: EditionId = selectedEdition, cord: CordStyle = cordStyle) => {
    setOrderConfirmedCode(null);
    const editionPrice = EDITIONS[editionId].price;
    setBag((prev) => {
      const idx = prev.findIndex(
        (item) => item.editionId === editionId && item.cord === cord
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { editionId, cord, price: editionPrice, qty: 1 }];
    });
    setDrawerOpen(true);
  };

  const updateBagQty = (idx: number, delta: number) => {
    setOrderConfirmedCode(null);
    setBag((prev) => {
      const next = [...prev];
      const nextQty = next[idx].qty + delta;
      if (nextQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], qty: nextQty };
      }
      return next;
    });
  };

  const handleCheckout = () => {
    if (bag.length === 0) return;
    setOrderConfirmedCode('BV-8042');
    setBag([]);
  };

  const handlePreviewIn3D = (id: EditionId) => {
    setSelectedEdition(id);
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
  };

  const totalQty = bag.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = bag.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <>
      {/* TOP BAR CONTRACT: 3 zones (Brand Wordmark — 4 Nav Links — 1 Primary Action) */}
      <header className="site-header">
        <div className="container header-inner">
          <a href="#hero" className="brand-wordmark">
            BUBI VICE
          </a>

          <nav className="header-nav" aria-label="Navegação principal">
            <a href="#hero" className="nav-link">
              Viewer 3D
            </a>
            <a href="#edicoes" className="nav-link">
              Edições
            </a>
            <a href="#detalhes" className="nav-link">
              Detalhes
            </a>
            <a href="#comprar" className="nav-link">
              Comprar
            </a>
          </nav>

          <div className="header-action">
            <button
              type="button"
              className="bag-cta-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label={`Abrir sacola com ${totalQty} itens`}
            >
              <ShoppingBag size={16} aria-hidden="true" />
              <span>Sacola</span>
              <span className="bag-cta-count">{totalQty}</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* SECTION 1: HERO + INTERACTIVE 3D BOTTLE STUDIO */}
        <section id="hero" className="hero">
          <canvas
            ref={heroCanvasRef}
            className="hero-canvas"
            aria-hidden="true"
          />

          <div className="container hero-inner">
            <div className="hero-split">
              <div className="hero-copy">
                <div className="kicker-meta">
                  <span>BUBI VICE</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular">650 ml</span>
                  <span aria-hidden="true">·</span>
                  <span>Edição Vice City</span>
                </div>

                <h1 className="hero-title">
                  Hidratação no ritmo de Vice City.
                </h1>

                <p className="hero-sub">
                  Garrafa térmica de 650 ml com acabamento fosco degradê, tampa
                  flip-top com abertura por botão e cordão trançado para levar
                  do setup gamer para a rua.
                </p>

                <div className="hero-actions">
                  <a href="#comprar" className="btn btn-primary">
                    <span>Configurar Garrafa</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                  <a href="#edicoes" className="btn btn-secondary">
                    Ver as 4 Edições
                  </a>
                </div>

                <div className="hero-active-edition-line">
                  <span
                    className="hero-edition-swatch"
                    style={{
                      background: `linear-gradient(135deg, ${activeEditionData.gradientStops[0]}, ${activeEditionData.gradientStops[1]})`,
                    }}
                  />
                  <span>
                    Visualizando em 3D: <strong>{activeEditionData.name}</strong>
                  </span>
                </div>
              </div>

              <div className="hero-3d-stage">
                <BubiViceBottle3D
                  activeEdition={selectedEdition}
                  onSelectEdition={setSelectedEdition}
                />
              </div>
            </div>

            {/* 4-column spec strip below hero split */}
            <div className="hero-spec-strip" aria-label="Especificações principais">
              <div className="hero-spec-cell">
                <span className="hero-spec-val">650 ml</span>
                <span className="hero-spec-label">
                  Capacidade compacta para setup e mochila
                </span>
              </div>
              <div className="hero-spec-cell">
                <span className="hero-spec-val">Fosco Degradê</span>
                <span className="hero-spec-label">
                  Revestimento powder-coat aveludado
                </span>
              </div>
              <div className="hero-spec-cell">
                <span className="hero-spec-val">Flip-Top Botão</span>
                <span className="hero-spec-label">
                  Abertura instantânea com trava segura
                </span>
              </div>
              <div className="hero-spec-cell">
                <span className="hero-spec-val">Cordão Trançado</span>
                <span className="hero-spec-label">
                  Alça removível com mosquetão giratório
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: 4 DISTINCT BUBI VICE EDITIONS */}
        <section id="edicoes" className="section-block editions-section">
          <div className="container">
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">Coleção Completa</p>
                <h2 className="section-title">
                  Quatro combinações. Mesma identidade BUBI VICE.
                </h2>
              </div>
              <p className="section-sub">
                Todas as quatro versões mantêm o corpo de 650 ml em degradê
                fosco, tampa flip-top com botão e cordão reforçado de transporte.
              </p>
            </div>

            <div className="editions-grid">
              {EDITION_ORDER.map((id) => {
                const ed = EDITIONS[id];
                const isSelected = selectedEdition === id;
                return (
                  <article
                    key={id}
                    className={`edition-card${isSelected ? ' is-selected' : ''}`}
                  >
                    <div className="edition-media">
                      <ProductImage
                        src={ed.image}
                        alt={ed.imageAlt}
                        className="edition-img"
                      />
                    </div>

                    <div className="edition-body">
                      <div className="edition-meta-line">
                        <span>{ed.badgeText}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular">650 ml</span>
                      </div>

                      <h3 className="edition-title">{ed.name}</h3>
                      <p className="edition-colors-text">{ed.subtitle}</p>

                      <div className="edition-footer">
                        <span className="edition-price">R$ {ed.price}</span>
                        <div className="edition-actions">
                          <button
                            type="button"
                            className="card-btn"
                            onClick={() => handlePreviewIn3D(id)}
                          >
                            Ver 3D
                          </button>
                          <button
                            type="button"
                            className="card-btn card-btn-buy"
                            onClick={() => {
                              setSelectedEdition(id);
                              addToBag(id, cordStyle);
                            }}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: ENGINEERING & DESIGN BENTO */}
        <section id="detalhes" className="section-block bento-section">
          <div className="container">
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">Design & Construção</p>
                <h2 className="section-title">
                  Projetada para o setup e para o asfalto.
                </h2>
              </div>
              <p className="section-sub">
                Cada componente combina resistência mecânica com a atmosfera
                tropical e neon de Vice City.
              </p>
            </div>

            <div className="bento-grid">
              <article className="bento-tile bento-tall">
                <ProductImage
                  src={EDITIONS.tropics.image}
                  alt={EDITIONS.tropics.imageAlt}
                  className="bento-img"
                />
                <div className="bento-overlay">
                  <h3 className="bento-title">
                    Tampa Flip-Top com Botão & Cordão
                  </h3>
                  <p className="bento-desc">
                    Pressione o botão frontal para liberar a tampa articulada com
                    uma mão. O cordão trançado acompanha mosquetão giratório para
                    prender na mochila ou carregar no pulso.
                  </p>
                </div>
              </article>

              <article className="bento-tile bento-top">
                <ProductImage
                  src={EDITIONS.noir.image}
                  alt={EDITIONS.noir.imageAlt}
                  className="bento-img"
                />
                <div className="bento-overlay">
                  <h3 className="bento-title">Degradê Fosco Anti-Marcas</h3>
                  <p className="bento-desc">
                    Textura powder-coat fosca de alta aderência, resistente a
                    riscos e sem reflexos indesejados na mesa gamer.
                  </p>
                </div>
              </article>

              <article className="bento-tile bento-bottom">
                <canvas
                  ref={specsCanvasRef}
                  className="specs-canvas"
                  aria-hidden="true"
                />
                <div className="bento-overlay bento-overlay-plain">
                  <div>
                    <h3 className="bento-title">Dupla Parede a Vácuo</h3>
                    <p className="bento-desc">
                      Aço inoxidável 18/8 sem condensação externa: 24h gelada e
                      12h quente.
                    </p>
                  </div>
                  <span className="bento-mono-tag">650 ml · 390 g</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 4: CONTIGUOUS PDP CONFIGURATOR & CHECKOUT */}
        <section id="comprar" className="order-section">
          <div className="container order-grid">
            <div className="order-preview">
              <ProductImage
                src={activeEditionData.image}
                alt={activeEditionData.imageAlt}
                className="order-preview-img"
              />
              <div className="order-preview-caption">
                <div>
                  <div className="order-preview-name">
                    {activeEditionData.name}
                  </div>
                  <div className="order-preview-sub">
                    {activeEditionData.subtitle}
                  </div>
                </div>
                <span className="bento-mono-tag">650 ml</span>
              </div>
            </div>

            <div className="order-panel">
              <div className="kicker-meta">
                <span>BUBI VICE</span>
                <span aria-hidden="true">·</span>
                <span>Garrafa Térmica Gamer</span>
              </div>

              <h2 className="section-title">
                BUBI VICE — {activeEditionData.name}
              </h2>

              <div className="order-price-row">
                <span className="order-price tabular">
                  R$ {activeEditionData.price},00
                </span>
                <span className="order-availability">
                  Pronta entrega · Envio 24h
                </span>
              </div>

              <p className="order-desc">{activeEditionData.tagline}</p>

              <div className="config-group">
                <span className="config-label">Escolha a Edição (4 cores)</span>
                <div className="option-grid" role="radiogroup" aria-label="Selecionar edição">
                  {EDITION_ORDER.map((id) => {
                    const ed = EDITIONS[id];
                    const isActive = selectedEdition === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        className={`edition-option-btn${isActive ? ' is-active' : ''}`}
                        onClick={() => setSelectedEdition(id)}
                      >
                        <span
                          className="edition-option-swatch"
                          style={{
                            background: `linear-gradient(135deg, ${ed.gradientStops[0]}, ${ed.gradientStops[1]})`,
                          }}
                        />
                        <span>{ed.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="config-group">
                <span className="config-label">Alça / Cordão de Transporte</span>
                <div className="cord-option-row" role="radiogroup" aria-label="Estilo de cordão">
                  {(['Combinado Vice', 'Preto Stealth'] as CordStyle[]).map(
                    (style) => (
                      <button
                        key={style}
                        type="button"
                        role="radio"
                        aria-checked={cordStyle === style}
                        className={`cord-option-btn${
                          cordStyle === style ? ' is-active' : ''
                        }`}
                        onClick={() => setCordStyle(style)}
                      >
                        {style}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="spec-list">
                {BOTTLE_SPECS.map((spec) => (
                  <div key={spec.label} className="spec-row">
                    <span className="spec-key">{spec.label}</span>
                    <span className="spec-val">{spec.value}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => addToBag(selectedEdition, cordStyle)}
              >
                Adicionar à Sacola — R$ {activeEditionData.price},00
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="footer-brand">BUBI VICE</span>
          <span>650 ml · Fosco Degradê · Flip-Top com Botão</span>
          <span>© 2026 BUBI VICE</span>
        </div>
      </footer>

      {/* Slide-Over Shopping Bag Drawer */}
      <div
        className="drawer-backdrop"
        hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className="bag-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        hidden={!drawerOpen}
      >
        <div className="drawer-header">
          <h2 id="drawer-title" className="drawer-title">
            Sua Sacola
          </h2>
          <button
            type="button"
            className="drawer-close-btn"
            aria-label="Fechar sacola"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-body">
          {orderConfirmedCode ? (
            <div className="drawer-receipt">
              <div className="drawer-receipt-title">
                <Check size={16} aria-hidden="true" />
                <span>Pedido #{orderConfirmedCode} Confirmado</span>
              </div>
              <p className="drawer-receipt-sub">
                Sua garrafa BUBI VICE 650 ml está em preparação para envio. Você
                receberá o código de rastreio por e-mail.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setOrderConfirmedCode(null);
                  setDrawerOpen(false);
                }}
              >
                Continuar Explorando
              </button>
            </div>
          ) : bag.length === 0 ? (
            <div className="drawer-empty">
              <p>Sua sacola está vazia.</p>
              <a
                href="#edicoes"
                className="btn btn-primary btn-sm"
                onClick={() => setDrawerOpen(false)}
              >
                Escolher Edição
              </a>
            </div>
          ) : (
            <div>
              {bag.map((item, idx) => {
                const ed = EDITIONS[item.editionId];
                return (
                  <div
                    key={`${item.editionId}-${item.cord}`}
                    className="bag-item"
                  >
                    <ProductImage
                      src={ed.image}
                      alt={ed.name}
                      className="bag-item-thumb"
                    />
                    <div className="bag-item-info">
                      <div className="bag-item-name">
                        BUBI VICE — {ed.name}
                      </div>
                      <div className="bag-item-meta">
                        650 ml · Cordão {item.cord}
                      </div>
                      <div className="bag-qty-row">
                        <div className="qty-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            aria-label="Diminuir quantidade"
                            onClick={() => updateBagQty(idx, -1)}
                          >
                            <Minus size={13} aria-hidden="true" />
                          </button>
                          <span className="bag-qty">{item.qty}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            aria-label="Aumentar quantidade"
                            onClick={() => updateBagQty(idx, 1)}
                          >
                            <Plus size={13} aria-hidden="true" />
                          </button>
                        </div>
                        <span className="bag-line-price">
                          R$ {item.price * item.qty},00
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="drawer-footer" hidden={bag.length === 0}>
          <div className="drawer-total-row">
            <span>Subtotal</span>
            <span className="drawer-total">R$ {totalPrice},00</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={handleCheckout}
          >
            Finalizar Pedido
          </button>
        </div>
      </aside>
    </>
  );
}
