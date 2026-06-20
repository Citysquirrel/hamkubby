interface ComposeProvidersProps {
	components: Array<React.ComponentType<{ children: React.ReactNode }>>;
	children: React.ReactNode;
}

export function ComposeProviders({ components, children }: ComposeProvidersProps) {
	return (
		<>
			{components.reduceRight((accumulator, CurrentComponent) => {
				return <CurrentComponent>{accumulator}</CurrentComponent>;
			}, children)}
		</>
	);
}
