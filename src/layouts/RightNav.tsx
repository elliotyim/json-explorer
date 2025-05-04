interface Props {
  json: Record<string, unknown> | unknown[]
}

const RightNav: React.FC<React.HTMLAttributes<HTMLDivElement> & Props> = ({
  json,
  ...props
}) => {
  return (
    <div {...props}>
      <pre className="thin-scrollbar h-full w-full overflow-x-auto bg-black p-2 text-white">
        {JSON.stringify(json, undefined, 2)}
      </pre>
    </div>
  )
}

export default RightNav
