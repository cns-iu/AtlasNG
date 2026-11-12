import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

/** A node in the sample anatomical hierarchy. */
interface AnatomyNode {
  /** Display name of the organ, tissue, or cell type. */
  name: string;
  /** Child nodes, absent on leaves. */
  children?: AnatomyNode[];
}

/** Organ > tissue > cell type sample data. */
const ANATOMY: AnatomyNode[] = [
  {
    name: 'Heart',
    children: [
      {
        name: 'Left ventricle',
        children: [{ name: 'Cardiomyocyte' }, { name: 'Fibroblast' }],
      },
      {
        name: 'Right atrium',
        children: [{ name: 'Pacemaker cell' }, { name: 'Endothelial cell' }],
      },
    ],
  },
  {
    name: 'Kidney',
    children: [
      {
        name: 'Renal cortex',
        children: [{ name: 'Podocyte' }, { name: 'Mesangial cell' }],
      },
      {
        name: 'Renal medulla',
        children: [{ name: 'Principal cell' }, { name: 'Intercalated cell' }],
      },
    ],
  },
  {
    name: 'Lung',
    children: [
      {
        name: 'Alveolus',
        children: [{ name: 'Type I pneumocyte' }, { name: 'Type II pneumocyte' }, { name: 'Alveolar macrophage' }],
      },
      {
        name: 'Bronchus',
        children: [{ name: 'Ciliated cell' }, { name: 'Goblet cell' }],
      },
    ],
  },
];

/**
 * Tokens that `mat.tree-density` and `mat.icon-button-density` emit at density scale -3.
 * Story styles are plain CSS, so the tokens are set directly instead of including the mixins.
 */
const COMPACT_STYLES = [
  `mat-tree {
      --mat-tree-node-min-height: 36px;
      --mat-icon-button-state-layer-size: 28px;
      --mat-icon-button-touch-target-display: none;
    }
  `,
];

/**
 * Returns the children of a node for the tree's `childrenAccessor` input.
 * @param node The node to expand.
 * @returns The node's children, or an empty array for a leaf.
 */
function childrenAccessor(node: AnatomyNode): AnatomyNode[] {
  return node.children ?? [];
}

/**
 * Node definition predicate that selects the expandable node template.
 * @param _index Position of the node in the flattened data.
 * @param node The node being rendered.
 * @returns Whether the node has children.
 */
function hasChildren(_index: number, node: AnatomyNode): boolean {
  return (node.children?.length ?? 0) > 0;
}

/** Story controls that are not inputs of `MatTree`. */
interface CustomizationControls {
  /** Padding added per tree level, in pixels. */
  indent: number;
}

/**
 * Builds a story render function for the sample tree.
 * @param styles Styles applied to the story.
 * @returns A story render function.
 */
function renderTree(styles: string[] = []): Story['render'] {
  return (args) => ({
    props: { ...args, nodes: ANATOMY, childrenAccessor, hasChildren },
    template: `
      <mat-tree #tree [dataSource]="nodes" [childrenAccessor]="childrenAccessor" aria-label="Anatomical structures">
        <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding [matTreeNodePaddingIndent]="indent">
          <button matIconButton disabled></button>
          {{ node.name }}
        </mat-tree-node>
        <mat-tree-node
          *matTreeNodeDef="let node; when: hasChildren"
          matTreeNodePadding
          [matTreeNodePaddingIndent]="indent"
          matTreeNodeToggle
          [isExpandable]="true"
          [cdkTreeNodeTypeaheadLabel]="node.name"
        >
          <button matIconButton matTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name">
            <mat-icon class="mat-icon-rtl-mirror">{{ tree.isExpanded(node) ? 'expand_more' : 'chevron_right' }}</mat-icon>
          </button>
          {{ node.name }}
        </mat-tree-node>
      </mat-tree>
    `,
    styles,
  });
}

const meta: Meta<MatTree<AnatomyNode> & CustomizationControls> = {
  title: 'Material/Tree',
  component: MatTree,
  args: {
    indent: 40,
  },
  argTypes: {
    indent: {
      control: { type: 'number', min: 0 },
      description: 'Padding added per tree level, in pixels. Material defaults to 40.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, MatIconModule, MatTreeModule],
    }),
  ],
};
export default meta;
type Story = StoryObj<MatTree<AnatomyNode> & CustomizationControls>;

export const Basic: Story = {
  render: renderTree(),
};

export const Compact: Story = {
  render: renderTree(COMPACT_STYLES),
};
